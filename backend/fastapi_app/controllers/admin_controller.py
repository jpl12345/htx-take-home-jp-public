import uuid
import sys
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi_app.config import BUCKET_NAME
from fastapi_app.database import get_db
from fastapi_app.models import User, AudioFile
from fastapi_app.schemas import UserCreate, UserOut, UserUpdate
from fastapi_app.utils import get_password_hash, s3
from fastapi_app.repositories.user_repo import create_user
from fastapi_app.dependencies import get_current_user, admin_required

router = APIRouter()

# GET /admin/users : List all users.
@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    return db.query(User).all()

# POST /admin/users : Create a new user (admin version).
@router.post("/users", response_model=UserOut)
def admin_create_user(user: UserCreate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    try:
        hashed_password = get_password_hash(user.password)
        new_user = User(
            username=user.username,
            email=user.email,
            password_hash=hashed_password,
            first_name=user.first_name,
            last_name=user.last_name,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# PUT /admin/users/{user_id} : Update an existing user's info.
@router.put("/users/{user_id}", response_model=UserOut)
def admin_update_user(user_id: uuid.UUID, user_data: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.username = user_data.username
    db_user.email = user_data.email
    db_user.first_name = user_data.first_name
    db_user.last_name = user_data.last_name
    if user_data.password:
        db_user.password_hash = get_password_hash(user_data.password)
    
    db.commit()
    db.refresh(db_user)
    return db_user

# DELETE /admin/users/{user_id} : Delete a user and all associated files.
@router.delete("/users/{user_id}")
def admin_delete_user(user_id: uuid.UUID, db: Session = Depends(get_db), admin: User = Depends(admin_required)):
    # Delete associated audio files from S3 before deleting the user.
    files = db.query(AudioFile).filter(AudioFile.user_id == user_id).all()
    for audio in files:
        if audio.file_path:
            # Extract full key including folder prefix
            file_key = audio.file_path.replace(f"https://{BUCKET_NAME}.s3.amazonaws.com/", "")
            try:
                s3.delete_object(Bucket=BUCKET_NAME, Key=file_key)
            except Exception as e:
                print(f"Error deleting S3 object {file_key}: {e}", file=sys.stderr)
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return {"detail": "User and all associated files deleted"}
