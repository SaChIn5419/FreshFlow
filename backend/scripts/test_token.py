import os
import sys

# Ensure backend directory is in path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.user import User
from app.core.security import create_access_token
from app.core.config import settings

def test_token():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "admin@freshflow.local").first()
    if not user:
        print("Admin user not found")
        return
        
    access_token = create_access_token(
        subject=str(user.id)
    )
    
    print(f"Token: {access_token}")

if __name__ == "__main__":
    test_token()
