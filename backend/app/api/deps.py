from typing import Optional
import uuid
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models.user import User
from app.repositories import UserRepository

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def verify_csrf_header(request: Request) -> None:
    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
        csrf_header = request.headers.get("X-Requested-With")
        if not csrf_header or csrf_header.strip() != "FreshFlow":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid or missing CSRF header X-Requested-With",
            )


async def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    bearer_token: Optional[str] = Depends(reusable_oauth2),
) -> User:
    token = request.cookies.get("access_token") or bearer_token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        sub = payload.get("sub")
        if sub is None:
            raise ValidationError("Missing sub in JWT")
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_repo = UserRepository(db)
    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID in token")

    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user
