import uuid
from typing import List
from app.repositories.customer_product_template_repository import CustomerProductTemplateRepository
from app.repositories import ProductRepository
from app.models.customer_product_template import CustomerProductTemplate
from app.core.exceptions import ProductNotFound, CustomerNotFound
from app.repositories import CustomerRepository


class CustomerProductTemplateService:
    def __init__(
        self,
        template_repo: CustomerProductTemplateRepository,
        customer_repo: CustomerRepository,
        product_repo: ProductRepository,
    ):
        self.template_repo = template_repo
        self.customer_repo = customer_repo
        self.product_repo = product_repo

    def get_template(self, customer_id: uuid.UUID) -> List[CustomerProductTemplate]:
        if not self.customer_repo.get_by_id(customer_id):
            raise CustomerNotFound()
        return self.template_repo.get_by_customer(customer_id)

    def assign_product(self, customer_id: uuid.UUID, product_id: uuid.UUID, sort_order: int = 0) -> CustomerProductTemplate:
        if not self.customer_repo.get_by_id(customer_id):
            raise CustomerNotFound()
        if not self.product_repo.get_by_id(product_id):
            raise ProductNotFound()
        entry = CustomerProductTemplate(
            customer_id=customer_id,
            product_id=product_id,
            sort_order=sort_order,
        )
        return self.template_repo.add(entry)

    def remove_product(self, customer_id: uuid.UUID, product_id: uuid.UUID) -> bool:
        return self.template_repo.remove(customer_id, product_id)
