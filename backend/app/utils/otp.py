import secrets
import string
from datetime import datetime, timedelta, timezone

OTP_LENGTH = 6
OTP_EXPIRE_MINUTES = 10
TOKEN_EXPIRE_HOURS = 24


def generate_otp() -> str:
    """Generate a 6-digit numeric OTP."""
    return "".join(secrets.choice(string.digits) for _ in range(OTP_LENGTH))


def generate_token() -> str:
    """Generate a secure URL-safe token (for email verification / password reset)."""
    return secrets.token_urlsafe(32)


def otp_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)


def token_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
