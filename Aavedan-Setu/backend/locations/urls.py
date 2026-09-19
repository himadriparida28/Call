from django.urls import path
from .views import StateListView, DistrictListView

urlpatterns = [
    path('states/', StateListView.as_view(), name='state-list'),
    path('districts/', DistrictListView.as_view(), name='district-list'),
]
