"""product categories

Revision ID: 013
Revises: 012
Create Date: 2026-05-29

"""

import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_CATEGORY_ID = str(uuid.uuid4())


def upgrade() -> None:
    connection = op.get_bind()

    for action in ("CATEGORY_CREATED", "CATEGORY_UPDATED", "CATEGORY_DEACTIVATED"):
        connection.execute(
            sa.text(
                f"""
                DO $$ BEGIN
                    ALTER TYPE financial_audit_action ADD VALUE '{action}';
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
                """
            )
        )

    connection.execute(
        sa.text(
            """
            DO $$ BEGIN
                ALTER TYPE financial_entity_type ADD VALUE 'PRODUCT_CATEGORY';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
            """
        )
    )

    op.create_table(
        "product_categories",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("color", sa.String(length=7), server_default="#6366f1", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_product_categories_name"), "product_categories", ["name"], unique=False)
    op.create_index(op.f("ix_product_categories_is_active"), "product_categories", ["is_active"], unique=False)

    connection.execute(
        sa.text(
            """
            INSERT INTO product_categories (id, name, description, color, is_active)
            VALUES (:id, 'Geral', 'Categoria padrão', '#6366f1', true)
            """
        ),
        {"id": DEFAULT_CATEGORY_ID},
    )

    op.add_column("products", sa.Column("category_id", sa.UUID(), nullable=True))
    connection.execute(
        sa.text("UPDATE products SET category_id = :category_id WHERE category_id IS NULL"),
        {"category_id": DEFAULT_CATEGORY_ID},
    )
    op.alter_column("products", "category_id", nullable=False)
    op.create_foreign_key(
        "fk_products_category_id",
        "products",
        "product_categories",
        ["category_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index(op.f("ix_products_category_id"), "products", ["category_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_products_category_id"), table_name="products")
    op.drop_constraint("fk_products_category_id", "products", type_="foreignkey")
    op.drop_column("products", "category_id")
    op.drop_index(op.f("ix_product_categories_is_active"), table_name="product_categories")
    op.drop_index(op.f("ix_product_categories_name"), table_name="product_categories")
    op.drop_table("product_categories")
