# fastapi_app/seed.py
from fastapi_app.database import SessionLocal, engine
from fastapi_app.models import Base, User
from fastapi_app.utils import get_password_hash

def seed_users():
    # Ensure all tables exist first.
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing_user1 = db.query(User).filter_by(username="user1").first()
        if not existing_user1:
            user1 = User(
                username="user1",
                email="john.doe@example.com",
                password_hash=get_password_hash("P@ssword12345!"),
                first_name="John",
                last_name="Doe",
                account_type="regular"
            )
            db.add(user1)

        existing_admin = db.query(User).filter_by(username="admin").first()
        if not existing_admin:
            admin = User(
                username="admin",
                email="jane.smith@example.com",
                password_hash=get_password_hash("P@ssword12345!"),
                first_name="Jane",
                last_name="Smith",
                account_type="superuser"
            )
            db.add(admin)

        db.commit()
        print("Database seeded successfully.")
    except Exception as e:
        db.rollback()
        print("Error seeding users:", e)
    finally:
        db.close()
