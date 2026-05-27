from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Barbearia SaaS API"
    app_version: str = "0.2.0"
    debug: bool = False

    database_url: str = "postgresql+asyncpg://barbearia:barbearia@localhost:5432/barbearia"
    redis_url: str = "redis://localhost:6379/0"

    cors_origins: str = "http://localhost:3000"

    jwt_secret_key: str = "change-me-access-secret"
    jwt_refresh_secret_key: str = "change-me-refresh-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    upload_dir: str = "uploads"
    media_url_prefix: str = "/uploads"
    max_upload_size_bytes: int = 5 * 1024 * 1024

    admin_email: str = ""
    admin_password: str = ""
    admin_name: str = "Administrador"


@lru_cache
def get_settings() -> Settings:
    return Settings()
