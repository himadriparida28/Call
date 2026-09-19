from rest_framework import serializers

from departments.models import Department

from .models import (
    SchemeCategory,
    GovernmentScheme,
    RequiredDocument,
)

class SimpleDepartmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Department

        fields = (
            "id",
            "name",
        )

class SchemeCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = SchemeCategory

        fields = (
            "id",
            "name",
            "description",
        )

class RequiredDocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = RequiredDocument

        fields = (
            "id",
            "document_name",
        )

class GovernmentSchemeListSerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField()
    department = SimpleDepartmentSerializer(read_only=True,)
    state = serializers.StringRelatedField()
    class Meta:
        model = GovernmentScheme
        fields = (
            "id",
            "scheme_code",
            "scheme_name",
            "category",
            "department",
            "state",
        )

class GovernmentSchemeDetailSerializer(serializers.ModelSerializer):
    category = SchemeCategorySerializer(read_only=True)
    department = SimpleDepartmentSerializer(read_only=True)
    state = serializers.StringRelatedField()
    required_documents = RequiredDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = GovernmentScheme
        fields = (
            "id",
            "scheme_code",
            "scheme_name",
            "category",
            "department",
            "state",
            "description",
            "benefits",
            "eligibility",
            "keywords",
            "official_website",
            "application_link",
            "helpline_number",
            "required_documents",
            "created_at",
            "updated_at",
        )