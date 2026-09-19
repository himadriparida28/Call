import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from accounts.models import User
from complaints.models import Complaint, CivicProject, ComplaintStatus
from categories.models import ComplaintCategory
from departments.models import Department
from locations.models import State, District

print("Seeding NGO accounts and sample assisted data...")

# 1. Create Demo NGO accounts
ngo_user1, _ = User.objects.get_or_create(
    email="sahayak@pradan.org",
    defaults={
        "full_name": "PRADAN Rural Sahayak (NGO Partner)",
        "phone": "9811122233",
        "role": "NGO_REPRESENTATIVE",
        "ngo_organization_name": "PRADAN Rural Foundation",
        "is_email_verified": True,
        "is_phone_verified": True
    }
)
ngo_user1.role = "NGO_REPRESENTATIVE"
ngo_user1.ngo_organization_name = "PRADAN Rural Foundation"
ngo_user1.save()

ngo_user2, _ = User.objects.get_or_create(
    email="audit@jansahas.org",
    defaults={
        "full_name": "Jan Sahas Social Auditor",
        "phone": "9844455566",
        "role": "NGO_REPRESENTATIVE",
        "ngo_organization_name": "Jan Sahas Social Audit Team",
        "is_email_verified": True,
        "is_phone_verified": True
    }
)
ngo_user2.role = "NGO_REPRESENTATIVE"
ngo_user2.ngo_organization_name = "Jan Sahas Social Audit Team"
ngo_user2.save()

# 2. Fetch dependencies
state = State.objects.filter(name__icontains="Bihar").first() or State.objects.first()
district = District.objects.filter(state=state).first() or District.objects.first()
category = ComplaintCategory.objects.filter(name__icontains="Water").first() or ComplaintCategory.objects.first()
dept = Department.objects.filter(name__icontains="Water").first() or Department.objects.first()
status_resolved, _ = ComplaintStatus.objects.get_or_create(name="resolved", defaults={"order": 4})
status_pending, _ = ComplaintStatus.objects.get_or_create(name="pending", defaults={"order": 1})

# 3. Create Sample Assisted Complaint
comp1, _ = Complaint.objects.get_or_create(
    title="Broken Water Pipeline near Panchayat Bhawan",
    defaults={
        "user": ngo_user1,
        "description": "The main drinking water pipe near the central panchayat office burst 4 days ago. Water is overflowing on the road and 40+ households have low water pressure.",
        "address": "Near Central Panchayat Bhawan, Ward No. 4",
        "landmark": "Opposite Primary School",
        "state": state,
        "district": district,
        "category": category,
        "department": dept,
        "status": status_pending,
        "priority": "HIGH",
        "is_assisted_filing": True,
        "assisted_by_ngo_name": "PRADAN Rural Foundation",
        "beneficiary_name": "Rameshwar Prasad (Elderly Citizen)",
        "beneficiary_phone": "9876543210",
        "is_ngo_audited": False,
        "estimated_cost": 35000.00
    }
)

# 4. Create Sample Social Audited Civic Project
proj1, _ = CivicProject.objects.get_or_create(
    title=f"{district.name} Drinking Water Supply Overhaul",
    district=district,
    defaults={
        "state": state,
        "category": category,
        "department": dept,
        "ward_name": "Ward 4 & 5 Central",
        "estimated_cost": 150000.00,
        "allocated_budget": 150000.00,
        "priority_score": 88.5,
        "priority_percentage": 28.4,
        "status": "COMPLETED",
        "resolution_remarks": "New high-density pipeline installed and connected to municipal reservoir.",
        "is_ngo_audited": True,
        "ngo_auditor_name": "Jan Sahas Social Audit Team",
        "ngo_audit_remarks": "On-ground physical audit conducted with local ward committee on 01-Sep-2026. Pressure testing verified.",
        "is_csr_supported": True,
        "csr_sponsor_name": "Tata Trusts & Local CSR Pool",
        "csr_pledged_amount": 50000.00
    }
)
proj1.complaints.add(comp1)

print(f"Successfully seeded demo NGO accounts, assisted complaint ({comp1.reference_number}), and social-audited Civic Project!")
