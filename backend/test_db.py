from sqlalchemy import create_engine
from app.models.user import User
from app.database.base_class import Base

# Let's just create an SQLite DB for development right now since docker isn't working
engine = create_engine("sqlite:///./test.sqlite", connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
print("Created tables in sqlite DB")
