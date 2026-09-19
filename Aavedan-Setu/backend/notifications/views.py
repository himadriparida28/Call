from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.generics import (
    GenericAPIView,
    ListAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationListSerializer

class NotificationListView(ListAPIView):
    serializer_class = NotificationListSerializer
    permission_classes = [IsAuthenticated]

    search_fields = (
        "title",
        "message",
    )

    ordering_fields = (
        "created_at",
    )

    ordering = (
        "-created_at",
    )

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user,
            is_deleted=False,
        )
    
class UnreadNotificationListView(ListAPIView):
    serializer_class = NotificationListSerializer
    permission_classes = [IsAuthenticated]

    ordering = (
        "-created_at",
    )

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user,
            is_deleted=False,
            is_read=False,
        )
    
class MarkAsReadView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notification = get_object_or_404(
            Notification,
            pk=pk,
            user=request.user,
            is_deleted=False,
        )

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        return Response(
            {
                "message": "Notification marked as read."
            },
            status=status.HTTP_200_OK,
        )
    
class MarkAllAsReadView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        Notification.objects.filter(
            user=request.user,
            is_deleted=False,
            is_read=False,
        ).update(is_read=True)

        return Response(
            {
                "message": "All notifications marked as read."
            },
            status=status.HTTP_200_OK,
        )
    
class UnreadNotificationCountView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_deleted=False,
            is_read=False,
        ).count()

        return Response(
            {
                "count": count,
            }
        )