import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Tuple, Optional
from sqlalchemy.orm import Session
from jose import jwt
import bcrypt
from app.core.config import settings
from app.models.refresh_token import RefreshToken


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")
    hash_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hash_bytes)


def get_password_hash(password: str) -> str:
    password_bytes = password.encode("utf-8")
    # Bcrypt max length is 72 bytes
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode("utf-8")


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(user_id: uuid.UUID, db: Session) -> Tuple[str, RefreshToken]:
    raw_token = secrets.token_urlsafe(32)
    t_hash = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    refresh_record = RefreshToken(
        user_id=user_id,
        token_hash=t_hash,
        expires_at=expires_at,
    )
    db.add(refresh_record)
    db.commit()
    db.refresh(refresh_record)
    return raw_token, refresh_record


def rotate_refresh_token(raw_token: str, db: Session) -> Optional[Tuple[str, str, uuid.UUID]]:
    t_hash = hash_token(raw_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == t_hash).first()
    if not record or record.revoked_at is not None:
        return None
    now = datetime.now(timezone.utc)
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        return None

    record.revoked_at = now
    db.commit()

    new_raw_refresh, _ = create_refresh_token(record.user_id, db)
    new_access_token = create_access_token(record.user_id)
    return new_access_token, new_raw_refresh, record.user_id


def revoke_refresh_token(raw_token: str, db: Session) -> bool:
    t_hash = hash_token(raw_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == t_hash).first()
    if record and record.revoked_at is None:
        record.revoked_at = datetime.now(timezone.utc)
        db.commit()
        return True
    return False
