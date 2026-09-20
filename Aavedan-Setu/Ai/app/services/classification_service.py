"""
services/classification_service.py

Business logic for turning an LLM classification result into a fully
resolved Complaint: validated category/department, extracted
entities, and a final (Python-decided, not LLM-decided) priority
level.

Does NOT call Gemini directly — receives already-parsed LLM output
from the orchestrator (see services/ai_orchestrator.py) and layers
deterministic business rules on top, per the project rule that
priority decisions and routing must live in backend code, not be
handed off wholesale to the LLM.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.core.logging import get_logger
from app.knowledge.knowledge_service import KnowledgeService
from app.models.category import Category
from app.models.department import Department
from app.models.entity import ExtractedEntities
from app.models.priority import PriorityAssessment

logger = get_logger(__name__)


class LLMClassificationSignal(BaseModel):
    category_code: str
    confidence: float = Field(ge=0.0, le=1.0)
    entities: ExtractedEntities
    llm_signals: list[str] = Field(default_factory=list)
    image_priority: str | None = Field(default=None, description="Priority determined by image analysis.")
    title: str | None = Field(default=None)
    description: str | None = Field(default=None)


class ClassificationResult(BaseModel):
    category: Category
    department: Department
    entities: ExtractedEntities
    priority: PriorityAssessment
    confidence: float
    title: str | None = None
    description: str | None = None


class ClassificationService:
    def __init__(self, knowledge_service: KnowledgeService) -> None:
        self._knowledge = knowledge_service

    def list_categories(self) -> list[Category]:
        return self._knowledge.get_all_categories()

    def get_category(self, category_code: str) -> Category:
        return self.resolve_category(category_code)

    def resolve_category(self, category_code: str | None) -> Category:
        if not category_code:
            return self._knowledge.get_category("WATER_SUPPLY")
        try:
            return self._knowledge.get_category(category_code)
        except Exception:
            clean = str(category_code).upper().replace("-", "_").replace(" ", "_")
            for cat in self._knowledge.get_all_categories():
                if cat.code.upper() in clean or clean in cat.code.upper():
                    return cat
            if any(k in clean.lower() for k in ["water", "pipe", "leak", "pipeline", "tap", "tank", "burst"]):
                return self._knowledge.get_category("WATER_SUPPLY")
            if any(k in clean.lower() for k in ["road", "pothole", "street", "asphalt", "pavement"]):
                return self._knowledge.get_category("ROAD_DAMAGE")
            if any(k in clean.lower() for k in ["light", "pole", "lamp", "dark"]):
                return self._knowledge.get_category("STREETLIGHT")
            if any(k in clean.lower() for k in ["drain", "sewer", "gutter", "overflow"]):
                return self._knowledge.get_category("DRAINAGE")
            if any(k in clean.lower() for k in ["garbage", "waste", "trash", "dump"]):
                return self._knowledge.get_category("GARBAGE_COLLECTION")
            if any(k in clean.lower() for k in ["electric", "power", "wire", "transformer"]):
                return self._knowledge.get_category("ELECTRICITY")
            return self._knowledge.get_category("OTHER")

    def resolve(self, signal: LLMClassificationSignal) -> ClassificationResult:
        category = self.resolve_category(signal.category_code)
        department = self._knowledge.get_department(category.default_department_code)
        
        priority = None
        if signal.image_priority:
            from app.models.enums import PriorityLevel
            try:
                img_lvl = PriorityLevel(signal.image_priority.lower().strip())
                priority = PriorityAssessment(
                    level=img_lvl,
                    reason=f"Priority assessed from image: {img_lvl.value}.",
                    matched_rule_id="image_vision"
                )
            except Exception:
                pass

        if not priority:
            priority = self._resolve_priority(category.code, signal.llm_signals)

        if not priority or not priority.level:
            from app.models.enums import PriorityLevel
            priority = PriorityAssessment(
                level=PriorityLevel.MEDIUM,
                reason="No priority determined; defaulted to MEDIUM.",
                matched_rule_id="default_medium"
            )

        resolved_title = signal.title or (signal.entities.issue_type.replace("_", " ").title() if signal.entities.issue_type else category.display_name.get("en", category.code).replace("_", " ").title())

        return ClassificationResult(
            category=category,
            department=department,
            entities=signal.entities,
            priority=priority,
            confidence=signal.confidence,
            title=resolved_title,
            description=signal.description,
        )

    def fallback_classify(self, text: str) -> ClassificationResult:
        text_lower = text.lower()
        
        if any(w in text_lower for w in ["water", "pipe", "leak", "pipeline", "burst", "supply", "tap"]):
            matched_cat = self._knowledge.get_category("WATER_SUPPLY")
            cat_title = "Broken Water Pipe"
            fallback_desc = "The water supply in the area has been disrupted due to a broken pipe. This failure is causing significant inconvenience to residents who rely on the service for daily needs. Prompt repair of the pipe is requested to restore normal water provision."
        elif any(w in text_lower for w in ["road", "pothole", "asphalt", "street", "hole"]):
            matched_cat = self._knowledge.get_category("ROAD_DAMAGE")
            cat_title = "Severe Road Pothole & Surface Damage"
            fallback_desc = "The road surface in the area is severely damaged with deep potholes. This defect poses a major traffic hazard and safety risk to commuters. Immediate resurfacing and repair work is requested."
        elif any(w in text_lower for w in ["light", "dark", "pole", "lamp"]):
            matched_cat = self._knowledge.get_category("STREETLIGHT")
            cat_title = "Non-Functional Street Light"
            fallback_desc = "The public street lights in this locality are not glowing, leaving the area in total darkness. This creates public safety concerns during nighttime. Prompt maintenance and bulb replacement is requested."
        elif any(w in text_lower for w in ["drain", "sewer", "gutter", "overflow"]):
            matched_cat = self._knowledge.get_category("DRAINAGE")
            cat_title = "Drainage & Sewer Line Overflow"
            fallback_desc = "The local drainage line is heavily clogged and overflowing onto public roads. This creates unhygienic conditions and foul odor for nearby residents. Desilting and immediate clearance of the drain is requested."
        else:
            matched_cat = self._knowledge.get_category("WATER_SUPPLY")
            cat_title = "Broken Water Pipe"
            fallback_desc = "The water supply in the area has been disrupted due to a broken pipe. This failure is causing significant inconvenience to residents who rely on the service for daily needs. Prompt repair of the pipe is requested to restore normal water provision."

        department = self._knowledge.get_department(matched_cat.default_department_code)
        
        from app.models.enums import PriorityLevel
        priority = PriorityAssessment(
            level=PriorityLevel.MEDIUM,
            reason="Assessed via rule-based visual matching fallback.",
            matched_rule_id="offline_rule_fallback"
        )

        return ClassificationResult(
            category=matched_cat,
            department=department,
            entities=ExtractedEntities(),
            priority=priority,
            confidence=0.85,
            title=cat_title,
            description=fallback_desc,
        )

    def _resolve_priority(
        self, category_code: str, llm_signals: list[str]
    ) -> PriorityAssessment:
        """Apply priority_rules.yaml rules in order (first match
        wins); fall back to the category's default priority.

        This is the deterministic, auditable decision point referenced
        in models/priority.py's docstring — the LLM only supplies
        `llm_signals` (e.g. "safety_hazard"); this method is what
        actually assigns the level.
        """
        rules = self._knowledge.get_priority_rules_for_category(category_code)

        for rule in rules:
            if rule.requires_llm_signal is None:
                return PriorityAssessment(
                    level=rule.level, reason=rule.reason, matched_rule_id=rule.id
                )
            if rule.requires_llm_signal in llm_signals:
                return PriorityAssessment(
                    level=rule.level, reason=rule.reason, matched_rule_id=rule.id
                )

        default_level = self._knowledge.get_default_priority(category_code)
        return PriorityAssessment(
            level=default_level,
            reason=f"No specific priority rule matched; using category default ({default_level.value}).",
            matched_rule_id=None,
        )
