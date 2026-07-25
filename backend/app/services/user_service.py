import uuid
from app.repositories import UserRepository
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

class UserService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def get_user(self, id: uuid.UUID) -> User | None:
        return self.repository.get_by_id(id)

    def get_user_by_email(self, email: str) -> User | None:
        return self.repository.get_by_email(email)

    def create_user(self, data: UserCreate) -> User:
        user = User(
            email=data.email,
            password_hash=get_password_hash(data.password),
            role=data.role
        )
        return self.repository.create(user)

    def update_user(self, id: uuid.UUID, data: UserUpdate) -> User | None:
        user = self.repository.get_by_id(id)
        if not user:
            return None
            
        if data.password:
            user.password_hash = get_password_hash(data.password)
            
        return self.repository.update(user)
