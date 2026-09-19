from django.db import models

class NotificationType(models.TextChoices):
    COMPLAINT_CREATED = (
        "COMPLAINT_CREATED",
        "Complaint Created",
    )

    COMPLAINT_UPDATED = (
        "COMPLAINT_UPDATED",
        "Complaint Updated",
    )

    COMPLAINT_ASSIGNED = (
        "COMPLAINT_ASSIGNED",
        "Complaint Assigned",
    )

    COMPLAINT_RESOLVED = (
        "COMPLAINT_RESOLVED",
        "Complaint Resolved",
    )

    SCHEME_RECOMMENDATION = (
        "SCHEME_RECOMMENDATION",
        "Scheme Recommendation",
    )

    SYSTEM = (
        "SYSTEM",
        "System",
    )