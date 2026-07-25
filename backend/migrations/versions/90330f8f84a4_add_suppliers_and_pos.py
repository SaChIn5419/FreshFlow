"""add_suppliers_and_pos

Revision ID: 90330f8f84a4
Revises: 738c186bd741
Create Date: 2026-07-18 19:54:17.237603

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90330f8f84a4'
down_revision: Union[str, None] = '738c186bd741'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('suppliers',
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('phone', sa.String(), nullable=True),
    sa.Column('whatsapp_number', sa.String(), nullable=True),
    sa.Column('email', sa.String(), nullable=True),
    sa.Column('address', sa.String(), nullable=True),
    sa.Column('credit_days', sa.Integer(), nullable=False),
    sa.Column('average_lead_time', sa.Integer(), nullable=False),
    sa.Column('current_balance', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('notes', sa.String(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('product_suppliers',
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('supplier_id', sa.UUID(), nullable=False),
    sa.Column('cost_price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('is_primary_supplier', sa.Boolean(), nullable=False),
    sa.Column('notes', sa.String(), nullable=True),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('purchase_orders',
    sa.Column('supplier_id', sa.UUID(), nullable=False),
    sa.Column('triggered_by_order_id', sa.UUID(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('expected_delivery', sa.Date(), nullable=True),
    sa.Column('whatsapp_message_text', sa.String(), nullable=True),
    sa.Column('total_cost', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ),
    sa.ForeignKeyConstraint(['triggered_by_order_id'], ['orders.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('purchase_order_items',
    sa.Column('purchase_order_id', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('quantity_ordered', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('unit', sa.String(), nullable=False),
    sa.Column('cost_price_at_time', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('quantity_received', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('is_received', sa.Boolean(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
    sa.ForeignKeyConstraint(['purchase_order_id'], ['purchase_orders.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.add_column('customers', sa.Column('credit_limit', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0.00'))
    op.add_column('orders', sa.Column('expected_delivery_date', sa.Date(), nullable=True))
    op.add_column('orders', sa.Column('delivery_notes', sa.String(), nullable=True))
    op.add_column('orders', sa.Column('internal_notes', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('orders', 'internal_notes')
    op.drop_column('orders', 'delivery_notes')
    op.drop_column('orders', 'expected_delivery_date')
    op.drop_column('customers', 'credit_limit')
    op.drop_table('purchase_order_items')
    op.drop_table('purchase_orders')
    op.drop_table('product_suppliers')
    op.drop_table('suppliers')
