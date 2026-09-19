from django.contrib import admin

from .models import (
    SchemeCategory,
    GovernmentScheme,
    RequiredDocument,
)

class RequiredDocumentInline(admin.TabularInline):
    model = RequiredDocument
    extra = 1

@admin.register(SchemeCategory)
class SchemeCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "is_active",
    )

    search_fields = (
        "name",
    )

    list_filter = (
        "is_active",
    )

@admin.register(GovernmentScheme)
class GovernmentSchemeAdmin(admin.ModelAdmin):

    inlines = [RequiredDocumentInline]

    list_display = (
        "scheme_name",
        "scheme_code",
        "department",
        "category",
        "state",
        "is_active",
    )

    search_fields = (
        "scheme_name",
        "scheme_code",
        "keywords",
    )

    list_filter = (
        "department",
        "category",
        "state",
        "is_active",
    )

    autocomplete_fields = (
        "department",
        "category",
        "state",
    )

@admin.register(RequiredDocument)
class RequiredDocumentAdmin(admin.ModelAdmin):

    list_display = (
        "document_name",
        "scheme",
    )

    search_fields = (
        "document_name",
        "scheme__scheme_name",
    )