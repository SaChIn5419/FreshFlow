from sqlalchemy import Column, Integer, String, Numeric, Boolean
from app.database.base_class import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    unit = Column(String, nullable=False)
    default_price = Column(Numeric(10, 2), nullable=True)
    is_active = Column(Boolean, default=True)
