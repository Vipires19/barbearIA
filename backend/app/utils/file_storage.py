import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import Settings
from app.core.exceptions import AppError

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
EXTENSION_BY_CONTENT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class FileStorageService:
    """Armazenamento local com interface preparada para migração cloud."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._base_dir = Path(settings.upload_dir)
        self._services_dir = self._base_dir / "services"
        self._professionals_dir = self._base_dir / "professionals"
        self._services_dir.mkdir(parents=True, exist_ok=True)
        self._professionals_dir.mkdir(parents=True, exist_ok=True)

    def validate_image(self, file: UploadFile) -> None:
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise AppError(
                "Formato inválido. Use JPEG, PNG ou WebP.",
                status_code=400,
            )
        if file.size is not None and file.size > self._settings.max_upload_size_bytes:
            raise AppError(
                f"Arquivo muito grande. Máximo: {self._settings.max_upload_size_bytes // (1024 * 1024)}MB",
                status_code=400,
            )

    async def save_service_image(self, file: UploadFile) -> str:
        self.validate_image(file)
        ext = EXTENSION_BY_CONTENT.get(file.content_type or "", ".jpg")
        filename = f"{uuid.uuid4()}{ext}"
        dest = self._services_dir / filename

        content = await file.read()
        if len(content) > self._settings.max_upload_size_bytes:
            raise AppError("Arquivo muito grande", status_code=400)

        dest.write_bytes(content)
        return f"{self._settings.media_url_prefix}/services/{filename}"

    async def save_professional_avatar(self, file: UploadFile) -> str:
        self.validate_image(file)
        ext = EXTENSION_BY_CONTENT.get(file.content_type or "", ".jpg")
        filename = f"{uuid.uuid4()}{ext}"
        dest = self._professionals_dir / filename

        content = await file.read()
        if len(content) > self._settings.max_upload_size_bytes:
            raise AppError("Arquivo muito grande", status_code=400)

        dest.write_bytes(content)
        return f"{self._settings.media_url_prefix}/professionals/{filename}"

    def delete_by_url(self, image_url: str | None) -> None:
        if not image_url or not image_url.startswith(self._settings.media_url_prefix):
            return
        relative = image_url.removeprefix(f"{self._settings.media_url_prefix}/")
        path = self._base_dir / relative
        if path.is_file():
            path.unlink()
