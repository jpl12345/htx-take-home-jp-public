import uuid, enum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from fastapi_app.database import Base

# Enum definitions
class AudioCategoryEnum(enum.Enum):
    Music = "Music"
    Podcast = "Podcast"
    VoiceNote = "Voice Note"
    Audiobook = "Audiobook"
    Others = "Others"

class User(Base):
    __tablename__ = "users"
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    account_type = Column(String(20), nullable=False, default="regular")
    created_at = Column(DateTime, default=func.now())
    last_logged_in = Column(DateTime, nullable=True)
    audio_files = relationship("AudioFile", back_populates="user", cascade="all, delete-orphan")

class AudioFile(Base):
    __tablename__ = "audio_files"
    file_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(
        AudioCategoryEnum, 
        values_callable=lambda enum_cls: [member.value for member in enum_cls],
        native_enum=False
    ), nullable=False)
    file_path = Column(Text, nullable=False)  # Updated after S3 upload
    upload_timestamp = Column(DateTime, default=func.now())
    processed_data = Column(JSONB, default=None)
    ai_processing_types = Column(ARRAY(String), default=None)
    checksum = Column(String, nullable=True)
    upload_status = Column(String, nullable=False, default="processing")
    user = relationship("User", back_populates="audio_files")

class SessionToken(Base):
    __tablename__ = "sessions"
    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    token = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=False)
