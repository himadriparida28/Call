from django.urls import path

from .views import (
    GovernmentSchemeListView,
    GovernmentSchemeDetailView,
)

urlpatterns = [
    path(
        "",
        GovernmentSchemeListView.as_view(),
        name="scheme-list",
    ),

    path(
        "<int:pk>/",
        GovernmentSchemeDetailView.as_view(),
        name="scheme-detail",
    ),
]