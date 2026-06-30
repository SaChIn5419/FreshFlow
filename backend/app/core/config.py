from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Wholesale Vegetable Procurement"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = "dev_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    # Use sqlite for local dev to avoid Docker DB errors
    DATABASE_URL: str = "sqlite:///./test.sqlite"

    class Config:
        env_file = ".env"


settings = Settings()
