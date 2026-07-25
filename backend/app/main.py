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

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "https://fresh-flow-mu.vercel.app",
    frontend_url
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(BaseAppException)
async def app_exception_handler(request: Request, exc: BaseAppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "error_id": exc.error_id},
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
