"""remove client from user_role enum

Revision ID: 006
Revises: 005
Create Date: 2026-05-27

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DELETE FROM users WHERE role::text = 'client'")
    op.execute("ALTER TYPE user_role RENAME TO user_role_old")
    op.execute("CREATE TYPE user_role AS ENUM ('admin', 'barber')")
    op.execute(
        """
        ALTER TABLE users
        ALTER COLUMN role DROP DEFAULT
        """
    )
    op.execute(
        """
        ALTER TABLE users
        ALTER COLUMN role TYPE user_role
        USING role::text::user_role
        """
    )
    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'barber'")
    op.execute("DROP TYPE user_role_old")


def downgrade() -> None:
    op.execute("ALTER TYPE user_role RENAME TO user_role_old")
    op.execute("CREATE TYPE user_role AS ENUM ('admin', 'barber', 'client')")
    op.execute(
        """
        ALTER TABLE users
        ALTER COLUMN role TYPE user_role
        USING role::text::user_role
        """
    )
    op.execute("DROP TYPE user_role_old")
