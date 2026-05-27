"""add user relation to professionals

Revision ID: 005
Revises: 004
Create Date: 2026-05-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("professionals", sa.Column("user_id", sa.UUID(), nullable=True))
    op.create_index(op.f("ix_professionals_user_id"), "professionals", ["user_id"], unique=False)
    op.create_foreign_key(
        "fk_professionals_user_id_users",
        "professionals",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_professionals_user_id_users", "professionals", type_="foreignkey")
    op.drop_index(op.f("ix_professionals_user_id"), table_name="professionals")
    op.drop_column("professionals", "user_id")
