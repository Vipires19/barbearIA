from app.models.user import User, UserRole

INTERNAL_ROLES = frozenset({UserRole.admin, UserRole.barber})


def is_internal_user(user: User) -> bool:
    return user.role in INTERNAL_ROLES


def require_internal_user(user: User) -> None:
    from app.core.exceptions import UnauthorizedError

    if not is_internal_user(user):
        raise UnauthorizedError("Acesso restrito a usuários internos")
