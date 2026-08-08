from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.settings import Settings, SettingsUpdate
from app.services.settings_service import SettingsService
from app.repositories import SettingsRepository

router = APIRouter()


def get_settings_service(db: Session = Depends(deps.get_db)) -> SettingsService:
    return SettingsService(SettingsRepository(db))


@router.get("/", response_model=Settings)
def read_settings(
    svc: SettingsService = Depends(get_settings_service),
    current_user=Depends(deps.get_current_active_user),
):
    return svc.get_settings()


@router.put("/", response_model=Settings)
def update_settings(
    data: SettingsUpdate,
    svc: SettingsService = Depends(get_settings_service),
    current_user=Depends(deps.get_current_active_admin),
):
    return svc.update_settings(data)


@router.post("/seed-database")
def trigger_seed_database(
    current_user=Depends(deps.get_current_active_admin)
):
    from app.database.seed import seed_db
    seed_db()
    return {"message": "Database seeded successfully from Excel files."}
