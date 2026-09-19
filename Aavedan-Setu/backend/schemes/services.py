from django.shortcuts import get_object_or_404

from .models import GovernmentScheme


class GovernmentSchemeService:

    @staticmethod
    def get_all_schemes():
        return GovernmentScheme.objects.filter(
            is_deleted=False,
            is_active=True,
        )

    @staticmethod
    def get_scheme_by_id(pk):
        return get_object_or_404(
            GovernmentScheme,
            pk=pk,
            is_deleted=False,
            is_active=True,
        )

    @staticmethod
    def get_schemes_by_category(category_id):
        return GovernmentScheme.objects.filter(
            category_id=category_id,
            is_deleted=False,
            is_active=True,
        )

    @staticmethod
    def get_schemes_by_department(department_id):
        return GovernmentScheme.objects.filter(
            department_id=department_id,
            is_deleted=False,
            is_active=True,
        )

    @staticmethod
    def get_schemes_by_state(state_id):
        return GovernmentScheme.objects.filter(
            state_id=state_id,
            is_deleted=False,
            is_active=True,
        )