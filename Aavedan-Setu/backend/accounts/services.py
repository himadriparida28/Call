import random
from datetime import timedelta

from django.utils import timezone

from .models import OTP


class OTPService:

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))

    @staticmethod
    def create_otp(phone, purpose, user=None):
        otp = OTPService.generate_otp()

        OTP.objects.filter(
            phone=phone,
            purpose=purpose,
            is_used=False,
        ).delete()

        otp_instance = OTP.objects.create(
            user=user,
            phone=phone,
            otp=otp,
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        return otp_instance
    
    @staticmethod
    def verify_otp(phone, otp, purpose):
        try:
            otp_instance = OTP.objects.get(
                phone=phone,
                otp=otp,
                purpose=purpose,
                is_used=False,
            )
        except OTP.DoesNotExist:
            return None

        if otp_instance.expires_at < timezone.now():
            return None

        return otp_instance

    @staticmethod
    def mark_used(otp_instance):
        otp_instance.is_used = True
        otp_instance.save(update_fields=["is_used"])