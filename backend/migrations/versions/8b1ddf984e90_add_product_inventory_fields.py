"""add_product_inventory_fields

Revision ID: 8b1ddf984e90
Revises: 90330f8f84a4
Create Date: 2026-07-18 20:06:36.412102

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b1ddf984e90'
down_revision: Union[str, None] = '90330f8f84a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('stock_quantity', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'))
    op.add_column('products', sa.Column('reorder_level', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'))


def downgrade() -> None:
    op.drop_column('products', 'reorder_level')
    op.drop_column('products', 'stock_quantity')
