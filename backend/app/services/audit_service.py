import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate

class AuditService:
    @staticmethod
    def _to_uuid(value) -> uuid.UUID:
        if isinstance(value, uuid.UUID):
            return value
        if isinstance(value, str) and value:
            return uuid.UUID(value)
        return uuid.uuid4()

    @staticmethod
    def log_action(
        db: Session,
        user_id,
        action: str,
        entity_type: str,
        entity_id=None,
        details: Optional[str] = None
    ) -> AuditLog:
        log_entry = AuditLog(
            user_id=AuditService._to_uuid(user_id),
            action=action,
            entity_type=entity_type,
            entity_id=AuditService._to_uuid(entity_id),
            details=details
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    @staticmethod
    def get_logs(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> dict:
        query = db.query(AuditLog)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (AuditLog.action.ilike(search_pattern)) |
                (AuditLog.details.ilike(search_pattern)) |
                (AuditLog.entity_type.ilike(search_pattern))
            )
        total = query.count()
        items = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "size": limit,
            "pages": (total + limit - 1) // limit if limit > 0 else 1
        }
