import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from locations.models import State, District

data = {
    "Delhi": {
        "code": "DL",
        "districts": ["Central Delhi", "New Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi"]
    },
    "Odisha": {
        "code": "OD",
        "districts": [
            "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", 
            "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", 
            "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Keonjhar", "Khordha", 
            "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", 
            "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"
        ]
    },
    "Jharkhand": {
        "code": "JH",
        "districts": [
            "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", 
            "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", 
            "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", 
            "Ramgarh", "Ranchi", "Sahibganj", "Saraikela Kharsawan", "Simdega", 
            "West Singhbhum"
        ]
    },
    "Bihar": {
        "code": "BR",
        "districts": [
            "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", 
            "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", 
            "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", 
            "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", 
            "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", 
            "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", 
            "Siwan", "Supaul", "Vaishali", "West Champaran"
        ]
    },
    "Maharashtra": {
        "code": "MH",
        "districts": ["Mumbai City", "Mumbai Suburban", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"]
    },
    "Karnataka": {
        "code": "KA",
        "districts": ["Bengaluru Urban", "Bengaluru Rural", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"]
    },
    "Tamil Nadu": {
        "code": "TN",
        "districts": ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy", "Tirunelveli"]
    },
    "Uttar Pradesh": {
        "code": "UP",
        "districts": ["Lucknow", "Kanpur Nagar", "Gautam Buddha Nagar", "Ghiazabad", "Varanasi", "Agra", "Allahabad"]
    },
    "West Bengal": {
        "code": "WB",
        "districts": ["Kolkata", "Howrah", "North 24 Parganas", "South 24 Parganas", "Darjeeling", "Hooghly"]
    },
    "Gujarat": {
        "code": "GJ",
        "districts": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar"]
    },
    "Telangana": {
        "code": "TG",
        "districts": ["Hyderabad", "Medchal-Malkajgiri", "Rangareddy", "Warangal", "Nizamabad"]
    },
    "Andhra Pradesh": {
        "code": "AP",
        "districts": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati"]
    }
}

print("Seeding locations...")
for state_name, info in data.items():
    state, created = State.objects.get_or_create(
        name=state_name,
        defaults={"code": info["code"]}
    )
    if created:
        print(f"Created State: {state_name}")
    else:
        print(f"State already exists: {state_name}")
        
    for dist_name in info["districts"]:
        district, d_created = District.objects.get_or_create(
            state=state,
            name=dist_name
        )
        if d_created:
            print(f"  Created District: {dist_name}")

print("Seeding completed successfully!")
