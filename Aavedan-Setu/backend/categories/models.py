from django.db import models

from common.models import BaseModel


class ComplaintCategory(BaseModel):
    name = models.CharField(
        max_length=100,
        unique=True
    )

    description = models.TextField(
        blank=True
    )

    icon = models.CharField(
        max_length=100,
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Complaint Category"
        verbose_name_plural = "Complaint Categories"

    def __str__(self):
        return self.name