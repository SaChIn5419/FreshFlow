"""add_packing_lists_tables

Revision ID: 3feb2d83aedc
Revises: 8b1ddf984e90
Create Date: 2026-07-18 20:13:12.193523

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3feb2d83aedc'
down_revision: Union[str, None] = '8b1ddf984e90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'packing_lists',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('order_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='Pending'),
        sa.Column('packed_by', sa.String(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id')
    )
    op.create_table(
        'packing_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('packing_list_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('quantity_requested', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('quantity_packed', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('is_packed', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['packing_list_id'], ['packing_lists.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('packing_items')
    op.drop_table('packing_lists')
