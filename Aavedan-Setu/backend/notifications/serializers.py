from rest_framework import serializers

from .models import Notification


class NotificationListSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification

        fields = (
            "id",
            "title",
            "message",
            "notification_type",
            "is_read",
            "action_url",
            "created_at",
        )

