import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        user_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        details: Optional[str] = None
    ) -> AuditLog:
        log_entry = AuditLog(
            user_id=str(user_id),
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    @staticmethod
    def get_logs(db: Session, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()
