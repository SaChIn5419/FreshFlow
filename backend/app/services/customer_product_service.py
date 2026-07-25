import uuid
from typing import List
from app.repositories import CustomerProductRepository
from app.models.customer_product import CustomerProduct

class CustomerProductService:
    def __init__(self, repository: CustomerProductRepository):
        self.repository = repository

    def get_favorites(self, customer_id: uuid.UUID) -> List[CustomerProduct]:
        return self.repository.get_by_customer(customer_id)

    def set_favorites(self, customer_id: uuid.UUID, products_data: List[dict]):
        self.repository.set_favorites(customer_id, products_data)
