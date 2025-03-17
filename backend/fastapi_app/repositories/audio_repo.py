from sqlalchemy.orm import Session
from fastapi_app.models import AudioFile

def get_audio_file(db: Session, file_id, user_id):
    return db.query(AudioFile).filter(AudioFile.file_id == file_id, AudioFile.user_id == user_id).first()

def get_audio_files_by_user(db: Session, user_id):
    return db.query(AudioFile).filter(AudioFile.user_id == user_id).all()

def create_audio_file(db: Session, audio_file: AudioFile):
    db.add(audio_file)
    db.commit()
    db.refresh(audio_file)
    return audio_file

def update_audio_file(db: Session, audio_file):
    db.commit()
    db.refresh(audio_file)
    return audio_file

def delete_audio_file(db: Session, audio_file):
    db.delete(audio_file)
    db.commit()
