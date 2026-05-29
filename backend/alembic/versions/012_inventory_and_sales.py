"""inventory and sales module

Revision ID: 012
Revises: 011
Create Date: 2026-05-29

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

inventory_movement_type = ENUM(
    "IN",
    "OUT",
    "ADJUSTMENT",
    name="inventory_movement_type",
    create_type=False,
)
sale_status = ENUM(
    "COMPLETED",
    "CANCELLED",
    name="sale_status",
    create_type=False,
)


def upgrade() -> None:
    connection = op.get_bind()

    for action in (
        "PRODUCT_CREATED",
        "PRODUCT_UPDATED",
        "STOCK_UPDATED",
        "SALE_CREATED",
        "SALE_CANCELLED",
    ):
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

    for entity in ("PRODUCT", "SALE", "INVENTORY_MOVEMENT"):
        connection.execute(
            sa.text(
                f"""
                DO $$ BEGIN
                    ALTER TYPE financial_entity_type ADD VALUE '{entity}';
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
                """
            )
        )

    op.create_table(
        "products",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("purchase_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("sale_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("stock_quantity", sa.Integer(), server_default="0", nullable=False),
        sa.Column("minimum_stock", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("stock_quantity >= 0", name="ck_products_stock_quantity_non_negative"),
        sa.CheckConstraint("minimum_stock >= 0", name="ck_products_minimum_stock_non_negative"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_products_name"), "products", ["name"], unique=False)
    op.create_index(op.f("ix_products_is_active"), "products", ["is_active"], unique=False)

    sale_status.create(connection, checkfirst=True)
    op.create_table(
        "sales",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("status", sale_status, nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_by", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["cancelled_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sales_status"), "sales", ["status"], unique=False)
    op.create_index(op.f("ix_sales_created_by"), "sales", ["created_by"], unique=False)
    op.create_index(op.f("ix_sales_created_at"), "sales", ["created_at"], unique=False)

    op.create_table(
        "sale_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("sale_id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_sale_items_sale_id"), "sale_items", ["sale_id"], unique=False)
    op.create_index(op.f("ix_sale_items_product_id"), "sale_items", ["product_id"], unique=False)

    inventory_movement_type.create(connection, checkfirst=True)
    op.create_table(
        "inventory_movements",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("product_id", sa.UUID(), nullable=False),
        sa.Column("movement_type", inventory_movement_type, nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("previous_stock", sa.Integer(), nullable=False),
        sa.Column("new_stock", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("sale_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_inventory_movements_product_id"), "inventory_movements", ["product_id"], unique=False)
    op.create_index(
        op.f("ix_inventory_movements_movement_type"), "inventory_movements", ["movement_type"], unique=False
    )
    op.create_index(op.f("ix_inventory_movements_created_by"), "inventory_movements", ["created_by"], unique=False)
    op.create_index(op.f("ix_inventory_movements_sale_id"), "inventory_movements", ["sale_id"], unique=False)
    op.create_index(op.f("ix_inventory_movements_created_at"), "inventory_movements", ["created_at"], unique=False)

    op.alter_column("financial_entries", "professional_id", existing_type=sa.UUID(), nullable=True)
    op.add_column("financial_entries", sa.Column("sale_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_financial_entries_sale_id",
        "financial_entries",
        "sales",
        ["sale_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_financial_entries_sale_id"), "financial_entries", ["sale_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_financial_entries_sale_id"), table_name="financial_entries")
    op.drop_constraint("fk_financial_entries_sale_id", "financial_entries", type_="foreignkey")
    op.drop_column("financial_entries", "sale_id")
    op.alter_column("financial_entries", "professional_id", existing_type=sa.UUID(), nullable=False)

    op.drop_index(op.f("ix_inventory_movements_created_at"), table_name="inventory_movements")
    op.drop_index(op.f("ix_inventory_movements_sale_id"), table_name="inventory_movements")
    op.drop_index(op.f("ix_inventory_movements_created_by"), table_name="inventory_movements")
    op.drop_index(op.f("ix_inventory_movements_movement_type"), table_name="inventory_movements")
    op.drop_index(op.f("ix_inventory_movements_product_id"), table_name="inventory_movements")
    op.drop_table("inventory_movements")
    inventory_movement_type.drop(op.get_bind(), checkfirst=True)

    op.drop_index(op.f("ix_sale_items_product_id"), table_name="sale_items")
    op.drop_index(op.f("ix_sale_items_sale_id"), table_name="sale_items")
    op.drop_table("sale_items")

    op.drop_index(op.f("ix_sales_created_at"), table_name="sales")
    op.drop_index(op.f("ix_sales_created_by"), table_name="sales")
    op.drop_index(op.f("ix_sales_status"), table_name="sales")
    op.drop_table("sales")
    sale_status.drop(op.get_bind(), checkfirst=True)

    op.drop_index(op.f("ix_products_is_active"), table_name="products")
    op.drop_index(op.f("ix_products_name"), table_name="products")
    op.drop_table("products")
