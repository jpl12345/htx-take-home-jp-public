import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi_app.database import get_db
from fastapi_app.models import User
from fastapi_app.schemas import UserCreate, UserOut
from fastapi_app.utils import get_password_hash
from fastapi_app.repositories.user_repo import create_user
from fastapi_app.dependencies import get_current_user

router = APIRouter()

# POST /users : Public user registration.
@router.post("/", response_model=UserOut)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
    )
    try:
        created = create_user(db, new_user)
        return created
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# PUT /users/{user_id} : Update current user's info.
@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: uuid.UUID, user_data: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    db_user.username = user_data.username
    db_user.email = user_data.email
    if user_data.password:
        db_user.password_hash = get_password_hash(user_data.password)

    db.commit()
    db.refresh(db_user)
    return db_user
