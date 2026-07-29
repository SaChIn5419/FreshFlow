from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
)
from app.api import deps
from app.services import UserService
from app.schemas.user import User

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    is_secure = settings.ENV != "dev"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=15 * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        path="/api/v1/auth/refresh",
        max_age=7 * 24 * 3600,
    )


@router.post("/login")
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    user_repo = deps.get_user_repository(db)
    user_svc = UserService(user_repo)
    user = user_svc.get_user_by_email(form_data.username)

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(subject=str(user.id))
    raw_refresh_token, _ = create_refresh_token(user.id, db)

    set_auth_cookies(response, access_token, raw_refresh_token)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": raw_refresh_token,
    }


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    db: Session = Depends(deps.get_db),
    body_refresh_token: Optional[str] = Body(None, embed=True),
):
    raw_refresh_token = request.cookies.get("refresh_token") or body_refresh_token
    if not raw_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
        )

    rotated = rotate_refresh_token(raw_refresh_token, db)
    if not rotated:
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token", path="/api/v1/auth/refresh")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    new_access_token, new_refresh_token, _ = rotated
    set_auth_cookies(response, new_access_token, new_refresh_token)

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "refresh_token": new_refresh_token,
    }


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: Session = Depends(deps.get_db),
):
    raw_refresh_token = request.cookies.get("refresh_token")
    if raw_refresh_token:
        revoke_refresh_token(raw_refresh_token, db)

    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token", path="/api/v1/auth/refresh")
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=User)
def read_users_me(current_user: User = Depends(deps.get_current_active_user)):
    return current_user
