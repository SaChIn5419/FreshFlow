from typing import Optional
from sqlalchemy.orm import Session
from app.models.settings import Settings

class SettingsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_settings(self) -> Optional[Settings]:
        return self.db.query(Settings).first()

    def update(self, settings: Settings) -> Settings:
        self.db.commit()
        self.db.refresh(settings)
        return settings

    def create(self, settings: Settings) -> Settings:
        self.db.add(settings)
        self.db.commit()
        self.db.refresh(settings)
        return settings
