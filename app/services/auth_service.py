import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.jwt import create_access_token, create_refresh_token, decode_refresh_token
from app.core.security import hash_password, verify_password
from app.models.token import RefreshToken, Token, TokenType
from app.models.user import User, UserRole
from app.schemas.auth import (
    Enable2FARequest,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    Verify2FARequest,
)
from app.utils.email import (
    send_2fa_otp_email,
    send_password_reset_email,
    send_verification_email,
)
from app.utils.otp import generate_otp, generate_token, otp_expiry, token_expiry
from app.utils.s3 import upload_profile_image

logger = logging.getLogger(__name__)


async def register_user(data: RegisterRequest) -> dict:
    existing = await User.find_one(User.email == data.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        password_hash=hash_password(data.password),
        role=data.role or UserRole.USER,
        is_active=False,
        is_verified=False,
    )
    await user.insert()
    logger.info("Registered new user: %s", user.email)

    token_value = generate_token()
    token = Token(
        user_id=user.id,
        token=token_value,
        type=TokenType.EMAIL_VERIFICATION,
        expires_at=token_expiry(),
    )
    await token.insert()

    send_verification_email(user.email, token_value)
    return {"message": "Registration successful. Check your email to verify your account."}


async def verify_email(token_value: str) -> dict:
    token = await Token.find_one(
        Token.token == token_value,
        Token.type == TokenType.EMAIL_VERIFICATION,
        Token.is_used == False,
    )
    if not token or token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

    user = await User.get(token.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_verified = True
    user.is_active = True
    await user.save()

    token.is_used = True
    await token.save()

    logger.info("Email verified for user: %s", user.email)
    return {"message": "Email verified successfully. You can now log in."}


async def login_user(data: LoginRequest) -> dict:
    user = await User.find_one(User.email == data.email)
    if not user or not verify_password(data.password, user.password_hash):
        logger.warning("Failed login attempt for email: %s", data.email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    if user.is_2fa_enabled:
        otp = generate_otp()
        otp_token = Token(
            user_id=user.id,
            token=otp,
            type=TokenType.TWO_FA_OTP,
            expires_at=otp_expiry(),
        )
        await otp_token.insert()
        send_2fa_otp_email(user.email, otp)
        logger.info("2FA OTP sent to: %s", user.email)
        return {"message": "OTP sent to your email. Please verify to complete login."}

    access_token = create_access_token(str(user.id), user.role)
    refresh_token_value = create_refresh_token(str(user.id))

    rt = RefreshToken(
        user_id=user.id,
        token=refresh_token_value,
        expires_at=datetime.now(timezone.utc).replace(
            second=0, microsecond=0
        ),
    )
    # Use a proper expiry
    from datetime import timedelta
    from app.core.config import settings
    rt.expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await rt.insert()

    logger.info("User logged in: %s", user.email)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token_value)


async def refresh_tokens(data: RefreshRequest) -> TokenResponse:
    user_id = decode_refresh_token(data.refresh_token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    stored = await RefreshToken.find_one(
        RefreshToken.token == data.refresh_token,
        RefreshToken.is_revoked == False,
    )
    if not stored or stored.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked")

    # Rotate — revoke old, issue new
    stored.is_revoked = True
    await stored.save()

    user = await User.get(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")

    new_access = create_access_token(str(user.id), user.role)
    new_refresh = create_refresh_token(str(user.id))

    from datetime import timedelta
    from app.core.config import settings
    new_rt = RefreshToken(
        user_id=user.id,
        token=new_refresh,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    await new_rt.insert()

    logger.info("Tokens rotated for user: %s", user_id)
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


async def logout_user(data: LogoutRequest) -> dict:
    stored = await RefreshToken.find_one(RefreshToken.token == data.refresh_token)
    if stored:
        stored.is_revoked = True
        await stored.save()
        logger.info("Refresh token revoked for user: %s", stored.user_id)
    return {"message": "Logged out successfully"}


async def forgot_password(data: ForgotPasswordRequest) -> dict:
    user = await User.find_one(User.email == data.email)
    # Always return the same message to avoid user enumeration
    if not user:
        return {"message": "If that email exists, an OTP has been sent."}

    otp = generate_otp()
    otp_token = Token(
        user_id=user.id,
        token=otp,
        type=TokenType.PASSWORD_RESET,
        expires_at=otp_expiry(),
    )
    await otp_token.insert()
    send_password_reset_email(user.email, otp)
    logger.info("Password reset OTP sent to: %s", user.email)
    return {"message": "If that email exists, an OTP has been sent."}


async def reset_password(data: ResetPasswordRequest) -> dict:
    token = await Token.find_one(
        Token.token == data.token,
        Token.type == TokenType.PASSWORD_RESET,
        Token.is_used == False,
    )
    if not token or token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")

    user = await User.get(token.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(data.new_password)
    await user.save()

    token.is_used = True
    await token.save()

    # Revoke all existing refresh tokens for security
    async for rt in RefreshToken.find(RefreshToken.user_id == user.id, RefreshToken.is_revoked == False):
        rt.is_revoked = True
        await rt.save()

    logger.info("Password reset for user: %s", user.email)
    return {"message": "Password reset successfully. Please log in again."}


async def update_profile_image(user: User, file) -> dict:
    from fastapi import UploadFile
    url = await upload_profile_image(file, str(user.id))
    user.profile_image_url = url
    await user.save()
    logger.info("Profile image updated for user: %s", user.email)
    return {"message": "Profile image updated.", "profile_image_url": url}


async def enable_2fa(user: User, data: Enable2FARequest) -> dict:
    user.is_2fa_enabled = data.enable
    await user.save()
    state = "enabled" if data.enable else "disabled"
    logger.info("2FA %s for user: %s", state, user.email)
    return {"message": f"Two-factor authentication {state}."}


async def verify_2fa(data: Verify2FARequest) -> TokenResponse:
    user = await User.find_one(User.email == data.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = await Token.find_one(
        Token.user_id == user.id,
        Token.token == data.otp,
        Token.type == TokenType.TWO_FA_OTP,
        Token.is_used == False,
    )
    if not token or token.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        logger.warning("Invalid 2FA OTP for user: %s", data.email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired OTP")

    token.is_used = True
    await token.save()

    access_token = create_access_token(str(user.id), user.role)
    refresh_token_value = create_refresh_token(str(user.id))

    from datetime import timedelta
    from app.core.config import settings
    rt = RefreshToken(
        user_id=user.id,
        token=refresh_token_value,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    await rt.insert()

    logger.info("2FA verified, tokens issued for: %s", user.email)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token_value)
