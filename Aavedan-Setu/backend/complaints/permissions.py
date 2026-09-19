from rest_framework.permissions import BasePermission


class IsComplaintOwner(BasePermission):
    """
    Allow access only to:
    - Complaint owner
    - Staff users
    """

    message = "You do not have permission to access this complaint."

    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_staff
            or obj.user == request.user
        )