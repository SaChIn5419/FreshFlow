from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_admin
from app.schemas.audit_log import AuditLogResponse
from app.schemas.pagination import PaginatedResponse
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[AuditLogResponse])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_admin)
):
    return AuditService.get_logs(db, skip=skip, limit=limit, search=search)
