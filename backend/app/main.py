import datetime
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.constants import PROJECT_NAME, VERSION, API_V1_STR
from app.api.v1.api import api_router
from app.database.session import get_db, engine
from app.core.exceptions import BaseAppException
from fastapi.responses import JSONResponse
from fastapi import Request
import os
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables exist in database on startup
    from app.database.base_class import Base
    import app.models
    
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed the database
    from app.database.seed import seed_db
    try:
        seed_db()
    except Exception as e:
        print(f"Startup database seeding error: {e}")
        
    yield

app = FastAPI(title=PROJECT_NAME, version=VERSION, lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

import uuid

@app.middleware("http")
async def security_headers(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

allowed_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

from sqlalchemy.exc import OperationalError, DatabaseError, DBAPIError, DisconnectionError

@app.exception_handler(BaseAppException)
async def app_exception_handler(request: Request, exc: BaseAppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "error_id": exc.error_id},
    )

@app.exception_handler(OperationalError)
@app.exception_handler(DatabaseError)
@app.exception_handler(DBAPIError)
@app.exception_handler(DisconnectionError)
async def db_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=503,
        content={"detail": "Database service is temporarily unavailable. Please try again shortly."},
    )

app.include_router(api_router, prefix=API_V1_STR)

@app.get("/")
def read_root():
    return {"message": f"Welcome to {PROJECT_NAME} API"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "UP"
    db_write_status = "UP"
    try:
        db.execute(text("SELECT 1"))
        # DB write check
        db.execute(text("CREATE TABLE IF NOT EXISTS _health_check (id INT PRIMARY KEY)"))
        db.execute(text("INSERT INTO _health_check (id) VALUES (1) ON CONFLICT(id) DO UPDATE SET id=1"))
        db.commit()
    except Exception as e:
        db.rollback()
        db_status = "DOWN"
        db_write_status = "DOWN"
        print(f"Health check failed: {e}")

    uploads_dir = os.path.abspath("uploads")
    uploads_status = "UP" if os.path.exists(uploads_dir) else "DOWN"

    return {
        "Application": "UP",
        "Database": db_status,
        "Database Write": db_write_status,
        "Uploads Directory": uploads_status,
        "Version": VERSION,
        "Environment": os.getenv("ENV", "development"),
        "Current Time": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
