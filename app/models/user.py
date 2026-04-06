from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import EmailStr, Field, HttpUrl


class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class User(Document):
    email: EmailStr = Field(..., unique=True)
    first_name: str
    last_name: str
    password_hash: str
    role: UserRole = UserRole.USER
    is_active: bool = False
    is_verified: bool = False
    is_2fa_enabled: bool = False
    profile_image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # How should this Python class behave inside MongoDB?
    # It is database-level configuration for your model
    class Settings: # Beanie model configuration class
        name = "users"
        indexes = [
        "email",
        # [("email", 1), ("is_active", 1)],  # compound index
    ]