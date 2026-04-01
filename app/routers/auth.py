from fastapi import APIRouter, Depends, Query

from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.auth import (
    Enable2FARequest,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    Verify2FARequest,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=MessageResponse, status_code=201)
async def register(data: RegisterRequest):
    return await auth_service.register_user(data)


@router.get("/verify-email", response_model=MessageResponse)
async def verify_email(token: str = Query(...)):
    return await auth_service.verify_email(token)


@router.post("/login")
async def login(data: LoginRequest):
    return await auth_service.login_user(data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest):
    return await auth_service.refresh_tokens(data)


@router.post("/logout", response_model=MessageResponse)
async def logout(data: LogoutRequest):
    return await auth_service.logout_user(data)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(data: ForgotPasswordRequest):
    return await auth_service.forgot_password(data)


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(data: ResetPasswordRequest):
    return await auth_service.reset_password(data)


@router.post("/enable-2fa", response_model=MessageResponse)
async def enable_2fa(
    data: Enable2FARequest,
    current_user: User = Depends(get_current_user),
):
    return await auth_service.enable_2fa(current_user, data)


@router.post("/verify-2fa", response_model=TokenResponse)
async def verify_2fa(data: Verify2FARequest):
    return await auth_service.verify_2fa(data)


# ── Protected example endpoints ────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_2fa_enabled=current_user.is_2fa_enabled,
    )


@router.get("/admin-only", response_model=MessageResponse)
async def admin_only(current_user: User = Depends(require_roles(UserRole.ADMIN))):
    return {"message": f"Hello admin {current_user.email}"}
