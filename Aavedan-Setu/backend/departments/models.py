from django.db import models

from common.models import BaseModel
from locations.models import State, District


class Department(BaseModel):# this represents type of departments
    name = models.CharField(
        max_length=100,
        unique=True
    )

    description = models.TextField(
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return self.name


class DepartmentOffice(BaseModel):# this represents the actual offices handling complaints.
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="offices"
    )

    state = models.ForeignKey(
        State,
        on_delete=models.CASCADE,
        related_name="department_offices"
    )

    district = models.ForeignKey(
        District,
        on_delete=models.CASCADE,
        related_name="department_offices"
    )

    office_name = models.CharField(
        max_length=150
    )

    address = models.TextField()

    email = models.EmailField(
        blank=True
    )

    phone = models.CharField(
        max_length=15,
        blank=True
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

    class Meta:
        ordering = ["office_name"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "department",
                    "district",
                    "office_name"
                ],
                name="unique_department_office"
            )
        ]

        verbose_name = "Department Office"
        verbose_name_plural = "Department Offices"

    def __str__(self):
        return f"{self.office_name} ({self.department.name})"