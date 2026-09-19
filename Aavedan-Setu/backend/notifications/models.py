from django.db import models

from accounts.models import User
from common.models import BaseModel
from complaints.models import Complaint

from .choices import NotificationType



class Notification(BaseModel):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )

    title = models.CharField(
        max_length=200,
    )

    message = models.TextField()

    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
    )

    is_read = models.BooleanField(
        default=False,
    )

    action_url = models.CharField(
    max_length=255,
    blank=True,
    null=True,
    )

    class Meta:
        ordering = [
            "-created_at",
        ]

        verbose_name = "Notification"

        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.user.email} - {self.title}"