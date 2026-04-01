from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import EmailStr, Field


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
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = ["email"]
