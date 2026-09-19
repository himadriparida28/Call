from django.contrib import admin

from .models import Department, DepartmentOffice


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "is_active",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "name",
    )


@admin.register(DepartmentOffice)
class DepartmentOfficeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "office_name",
        "department",
        "district",
        "state",
        "is_active",
    )

    list_filter = (
        "department",
        "state",
        "district",
        "is_active",
    )

    search_fields = (
        "office_name",
        "department__name",
    )