from app.repositories import SettingsRepository
from app.models.settings import Settings
from app.schemas.settings import SettingsUpdate


class SettingsService:
    def __init__(self, repo: SettingsRepository):
        self.repo = repo

    def get_settings(self) -> Settings:
        settings = self.repo.get_settings()
        if not settings:
            # Auto-create with defaults on first access
            settings = Settings()
            settings = self.repo.create(settings)
        return settings

    def update_settings(self, data: SettingsUpdate) -> Settings:
        settings = self.get_settings()
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        return self.repo.update(settings)
