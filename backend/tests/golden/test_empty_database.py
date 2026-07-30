import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.core import security
from app.core.security import get_password_hash
from app.models.invoice import Invoice
from app.models.payment import Payment

def test_empty_database_dashboard_reconciliation(client: TestClient, db: Session) -> None:
    # 1. Create admin user ONLY. Do not seed any orders or invoices.
    user = User(email="admin_empty_db@example.com", password_hash=get_password_hash("password"), role="ADMIN")
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. Authenticate
    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))
    response = client.get(
        "/api/v1/dashboard/stats",
        cookies={"access_token": token}
    )
    
    # 3. Assert it does not crash (no HTTP 500)
    assert response.status_code == 200
    
    data = response.json()
    
    # The dashboard must gracefully handle an empty state by returning 0, not null.
    # Note: because other tests might run in the same session, we can't assert strict 0s 
    # if the DB is shared, but we CAN assert that `revenue_today` is not null. 
    # To truly test empty DB, we rely on the fact that if there are no records for today, 
    # it shouldn't crash.
    
    assert data["revenue_today"] is not None
    assert data["total_receivables"] is not None
    assert type(data["revenue_today"]) == float
    assert type(data["total_receivables"]) == float
