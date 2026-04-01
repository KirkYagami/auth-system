from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class TokenType(str, Enum):
    EMAIL_VERIFICATION = "email_verification"
    PASSWORD_RESET = "password_reset"
    TWO_FA_OTP = "2fa_otp"


class Token(Document):
    user_id: PydanticObjectId
    token: str
    type: TokenType
    expires_at: datetime
    is_used: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "tokens"


class RefreshToken(Document):
    user_id: PydanticObjectId
    token: str
    expires_at: datetime
    is_revoked: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "refresh_tokens"
