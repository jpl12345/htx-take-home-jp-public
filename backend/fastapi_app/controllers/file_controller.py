import uuid
import os
import sys
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Response
from sqlalchemy.orm import Session
from fastapi_app.database import get_db
from fastapi_app.models import AudioFile, AudioCategoryEnum, User
from fastapi_app.schemas import AudioFileOut
from fastapi_app.repositories.audio_repo import get_audio_file
from fastapi_app.services.audio_service import process_upload
from fastapi_app.utils import save_file_to_disk_and_checksum, s3
from fastapi_app.config import ALLOWED_AUDIO_MIME_TYPES, BUCKET_NAME
from fastapi_app.dependencies import get_current_user

router = APIRouter()

# POST /upload : Upload an audio file.
@router.post("/upload", response_model=AudioFileOut)
async def upload_audio_file(
    background_tasks: BackgroundTasks,
    description: str,
    category: AudioCategoryEnum,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_AUDIO_MIME_TYPES:
        allowed_list = ", ".join(ALLOWED_AUDIO_MIME_TYPES)
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} is not allowed. Allowed: {allowed_list}"
        )
    
    # Save file to disk and compute checksum.
    file_location, checksum = await save_file_to_disk_and_checksum(file)
    
    try:
        # Check for duplicate by content.
        duplicate_by_checksum = db.query(AudioFile).filter(
            AudioFile.user_id == current_user.user_id,
            AudioFile.checksum == checksum,
            AudioFile.upload_status == "completed"
        ).first()
        if duplicate_by_checksum:
            if os.path.exists(file_location):
                os.remove(file_location)
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate file detected with ID {duplicate_by_checksum.file_id} and description '{duplicate_by_checksum.description}'"
            )
        
        # Check for duplicate by description.
        duplicate_by_description = db.query(AudioFile).filter(
            AudioFile.user_id == current_user.user_id,
            AudioFile.description == description,
            AudioFile.upload_status == "completed"
        ).first()
        if duplicate_by_description:
            if os.path.exists(file_location):
                os.remove(file_location)
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate description detected. A file with description '{duplicate_by_description.description}' has already been uploaded."
            )
        
        # Create new upload record.
        new_audio = AudioFile(
            user_id=current_user.user_id,
            description=description,
            category=category,
            file_path="",  # update after S3 upload.
            upload_status="processing",
            checksum=checksum
        )
        db.add(new_audio)
        db.commit()
        db.refresh(new_audio)
        upload_id = new_audio.file_id
    except Exception as e:
        db.rollback()
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(status_code=500, detail=f"Error creating upload record: {str(e)}")
    
    background_tasks.add_task(
        process_upload, file_location, checksum, description, category,
        str(upload_id), current_user.user_id, file.filename
    )
    return new_audio

# GET /upload-status/{file_id} : Retrieve the upload status.
@router.get("/upload-status/{file_id}", response_model=AudioFileOut)
def upload_status(file_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = db.query(AudioFile).filter(
        AudioFile.file_id == file_id,
        AudioFile.user_id == current_user.user_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Upload record not found")
    return record

# GET /files : Retrieve all audio files for the current user.
@router.get("/", response_model=list[AudioFileOut])
def get_audio_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AudioFile).filter(AudioFile.user_id == current_user.user_id).all()

# DELETE /files/{file_id} : Delete an individual audio file.
@router.delete("/{file_id}")
def delete_audio_file(file_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audio_file = db.query(AudioFile).filter(
        AudioFile.file_id == file_id,
        AudioFile.user_id == current_user.user_id
    ).first()
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found or not authorized")
    
    if audio_file.file_path:
        file_key = audio_file.file_path.replace(f"https://{BUCKET_NAME}.s3.amazonaws.com/", "")
        try:
            s3.delete_object(Bucket=BUCKET_NAME, Key=file_key)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting file from S3: {str(e)}")
    
    db.delete(audio_file)
    db.commit()
    return {"detail": "Audio file deleted"}

# GET /files/{file_id}/playback : Generate a pre-signed URL for playback.
@router.get("/{file_id}/playback")
def playback_audio_file(file_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audio_file = db.query(AudioFile).filter(
        AudioFile.file_id == file_id,
        AudioFile.user_id == current_user.user_id
    ).first()
    if not audio_file:
        raise HTTPException(status_code=404, detail="Audio file not found or not authorized")
    file_key = audio_file.file_path.replace(f"https://{BUCKET_NAME}.s3.amazonaws.com/", "")
    try:
        presigned_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': BUCKET_NAME, 'Key': file_key},
            ExpiresIn=3600
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate pre-signed URL: {str(e)}")
    return {"file_path": presigned_url}
