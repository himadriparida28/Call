from django.db import models
from departments.models import Department
from locations.models import State
from common.models import BaseModel


class SchemeCategory(BaseModel):
    name = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Scheme Category"
        verbose_name_plural = "Scheme Categories"

    def __str__(self):
        return self.name
    



class GovernmentScheme(BaseModel):
    category = models.ForeignKey(
        SchemeCategory,
        on_delete=models.PROTECT,
        related_name="schemes",
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="schemes",
    )

    state = models.ForeignKey(
        State,
        on_delete=models.PROTECT,
        related_name="schemes",
        null=True,
        blank=True,
    )

    scheme_name = models.CharField(
        max_length=250,
        unique=True,
    )

    scheme_code = models.CharField(
    max_length=50,
    unique=True,
    blank=True,
    )

    description = models.TextField()

    benefits = models.TextField()

    eligibility = models.TextField()

    keywords = models.TextField(
        blank=True,
        help_text="Comma separated keywords for AI recommendation.",
    )

    official_website = models.URLField()

    application_link = models.URLField()

    helpline_number = models.CharField(
    max_length=20,
    blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    class Meta:
        ordering = ["scheme_name"]
        verbose_name = "Government Scheme"
        verbose_name_plural = "Government Schemes"

    def __str__(self):
        return self.scheme_name
    
class RequiredDocument(BaseModel):
    scheme = models.ForeignKey(
        GovernmentScheme,
        on_delete=models.CASCADE,
        related_name="required_documents",
    )

    document_name = models.CharField(
        max_length=150,
    )

    class Meta:
        ordering = ["document_name"]

        constraints = [
            models.UniqueConstraint(
                fields=["scheme", "document_name"],
                name="unique_required_document",
            )
        ]

        verbose_name = "Required Document"
        verbose_name_plural = "Required Documents"

    def __str__(self):
        return f"{self.document_name} ({self.scheme.scheme_name})"