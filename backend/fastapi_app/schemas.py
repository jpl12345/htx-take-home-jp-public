import uuid, datetime, re
from typing import List, Optional
from pydantic import BaseModel, EmailStr, validator
from fastapi_app.models import AudioCategoryEnum

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str

    @validator("password")
    def password_valid(cls, value):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r'\d', value):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[a-zA-Z]', value):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValueError("Password must contain at least one special symbol")
        if not (re.search(r'[a-z]', value) and re.search(r'[A-Z]', value)):
            raise ValueError("Password must contain both lowercase and uppercase letters")
        return value

    @validator("email")
    def email_valid(cls, value):
        email_regex = re.compile(r"^\S+@\S+\.\S+$")
        if not email_regex.match(value):
            raise ValueError("Invalid email address format")
        return value

class UserUpdate(BaseModel):
    username: str
    email: EmailStr
    password: Optional[str] = None  # Optional for update
    first_name: str
    last_name: str

    @validator("password")
    def password_valid(cls, value):
        if not value or value.strip() == "":
            return value
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r'\d', value):
            raise ValueError("Password must contain at least one number")
        if not re.search(r'[a-zA-Z]', value):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValueError("Password must contain at least one special symbol")
        if not (re.search(r'[a-z]', value) and re.search(r'[A-Z]', value)):
            raise ValueError("Password must contain both lowercase and uppercase letters")
        return value

class UserOut(BaseModel):
    user_id: uuid.UUID
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    account_type: str
    created_at: datetime.datetime
    last_logged_in: Optional[datetime.datetime] = None

    class Config:
        orm_mode = True

class AudioFileCreate(BaseModel):
    description: str
    category: AudioCategoryEnum

class AudioFileOut(BaseModel):
    file_id: uuid.UUID
    description: str
    category: AudioCategoryEnum
    file_path: str
    upload_timestamp: datetime.datetime
    processed_data: Optional[dict] = None
    ai_processing_types: Optional[List[str]] = None
    checksum: Optional[str] = None
    upload_status: str

    class Config:
        orm_mode = True
