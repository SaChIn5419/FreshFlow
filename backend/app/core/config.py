import sys
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SECRET = "dev_secret_key_change_in_production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENV: str = "dev"
    SECRET_KEY: str = DEFAULT_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "sqlite:///./test.sqlite"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8000,https://fresh-flow-mu.vercel.app"

    @model_validator(mode="after")
    def enforce_secret_key(self):
        if self.ENV != "dev" and self.SECRET_KEY == DEFAULT_SECRET:
            sys.exit("FATAL: SECRET_KEY must be set via env var in non-dev environments")
        return self


settings = Settings()
