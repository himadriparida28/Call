from django.contrib import admin

from .models import (
    Complaint,
    ComplaintImage,
    ComplaintStatus,
    ComplaintStatusHistory,
)

@admin.register(ComplaintStatus)
class ComplaintStatusAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "order", "is_active",)

    list_filter = (
        "is_active",
    )

    ordering = (
        "order",
    )

    search_fields = (
        "name",
    )

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        "reference_number",
        "title",
        "user",
        "status",
        "priority",
        "district",
        "created_at",
    )

    list_filter = (
        "status",
        "priority",
        "district",
        "category",
    )

    search_fields = (
        "reference_number",
        "title",
        "description",
        "user__email",
        "user__phone",
    )

    autocomplete_fields = (
        "user",
        "category",
        "department",
        "department_office",
        "state",
        "district",
        "status",
    )

    readonly_fields = (
        "reference_number",
        "created_at",
        "updated_at",
    )

@admin.register(ComplaintImage)
class ComplaintImageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "complaint",
        "created_at",
    )

    search_fields = (
        "complaint__reference_number",
    )

@admin.register(ComplaintStatusHistory)
class ComplaintStatusHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "complaint",
        "old_status",
        "new_status",
        "created_at",
    )

    list_filter = (
        "new_status",
    )

    search_fields = (
        "complaint__reference_number",
    )