import uuid
from typing import List
from app.repositories import CustomerRepository, UserRepository, ProductRepository
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.core.security import get_password_hash
from app.core.exceptions import BaseAppException

class CustomerService:
    def __init__(self, repository: CustomerRepository, user_repo: UserRepository, product_repo: ProductRepository):
        self.repository = repository
        self.user_repo = user_repo
        self.product_repo = product_repo

    def get_customer(self, id: uuid.UUID) -> Customer | None:
        return self.repository.get_by_id(id)

    def get_all_customers(self) -> List[Customer]:
        return self.repository.get_all()

    def create_customer(self, data: CustomerCreate) -> Customer:
        # Check if email is already taken
        if self.user_repo.get_by_email(data.email):
            raise BaseAppException(status_code=400, message="Email already registered", error_id="email_registered")

        # 1. Create the user
        user = User(
            email=data.email,
            password_hash=get_password_hash(data.password),
            role="CUSTOMER"
        )
        created_user = self.user_repo.create(user)

        # 2. Create the customer and link to user
        customer = Customer(
            user_id=created_user.id,
            restaurant_name=data.restaurant_name,
            contact_person=data.contact_person,
            gst_number=data.gst_number,
            phone=data.phone,
            address=data.address,
            credit_days=data.credit_days,
            is_active=data.is_active
        )
        created_customer = self.repository.create(customer)

        # 3. Auto-assign all active products to the template by default
        products = self.product_repo.get_all()
        for p in products:
            if p.is_active:
                from app.models.customer_product_template import CustomerProductTemplate
                self.repository.db.add(CustomerProductTemplate(
                    customer_id=created_customer.id,
                    product_id=p.id,
                    sort_order=0
                ))
        self.repository.db.commit()

        return created_customer

    def update_customer(self, id: uuid.UUID, data: CustomerUpdate) -> Customer | None:
        customer = self.repository.get_by_id(id)
        if not customer:
            return None
        customer.restaurant_name = data.restaurant_name
        customer.contact_person = data.contact_person
        customer.gst_number = data.gst_number
        customer.phone = data.phone
        customer.address = data.address
        customer.credit_days = data.credit_days
        customer.is_active = data.is_active

        # Update associated User login credentials if provided
        if customer.user_id:
            user = self.user_repo.get_by_id(customer.user_id)
            if user:
                if data.email and data.email.strip() and data.email != user.email:
                    existing = self.user_repo.get_by_email(data.email)
                    if existing and existing.id != user.id:
                        raise BaseAppException(status_code=400, message="Email already in use", error_id="email_registered")
                    user.email = data.email.strip()
                if data.password and data.password.strip():
                    user.password_hash = get_password_hash(data.password.strip())
                self.user_repo.update(user)

        return self.repository.update(customer)

    def deactivate_customer(self, id: uuid.UUID) -> bool:
        customer = self.repository.get_by_id(id)
        if not customer:
            return False
        self.repository.deactivate(customer)
        return True
