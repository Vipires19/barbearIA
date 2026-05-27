import re

from app.core.exceptions import AppError

_DIGITS_ONLY = re.compile(r"\D")


def digits_only(phone: str) -> str:
    return _DIGITS_ONLY.sub("", phone or "")


def normalize_client_phone(phone: str) -> str:
    """Remove não-dígitos; valida tamanho mínimo (identificador público)."""
    raw = (phone or "").strip()
    digits = digits_only(raw)
    if len(digits) < 10:
        raise AppError("Telefone inválido: informe DDD + número", status_code=400)
    if len(digits) > 15:
        raise AppError("Telefone inválido: muitos dígitos", status_code=400)
    return digits


def mask_client_display_name(full_name: str) -> str:
    parts = [p for p in (full_name or "").strip().split() if p]
    if not parts:
        return "Cliente"
    if len(parts) == 1:
        return parts[0][:1].upper() + parts[0][1:].lower() if parts[0] else "Cliente"
    first = parts[0].strip()
    initial = parts[-1][0].upper() if parts[-1] else ""
    return f"{first} {initial}."
