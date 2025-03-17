import os, uuid, sys
import aiofiles
import aioboto3
from fastapi import HTTPException
from fastapi_app.config import AWS_ACCESS_KEY, AWS_SECRET_KEY, BUCKET_NAME
from fastapi_app.database import SessionLocal
from fastapi_app.models import AudioFile

async def upload_file_to_s3(file_path: str, file_key: str) -> None:
    session = aioboto3.Session(
        aws_access_key_id=AWS_ACCESS_KEY,
        aws_secret_access_key=AWS_SECRET_KEY,
    )
    async with session.client("s3") as s3_client:
        async with aiofiles.open(file_path, "rb") as f:
            data = await f.read()
        await s3_client.put_object(Bucket=BUCKET_NAME, Key=file_key, Body=data)
    os.remove(file_path)

async def process_upload(
    file_location: str,
    checksum: str,
    description: str,
    category,
    upload_id: str,
    user_id: str,
    original_filename: str
):
    try:
        file_key = f"{user_id}/{uuid.uuid4()}_{original_filename}"
        await upload_file_to_s3(file_location, file_key)
        s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_key}"

        db = SessionLocal()
        try:
            upload_record = db.query(AudioFile).filter(AudioFile.file_id == upload_id).first()
            if upload_record:
                upload_record.file_path = s3_url
                upload_record.upload_status = "completed"
                db.commit()
        except Exception as e:
            db.rollback()
            print("DB error updating upload record:", e, file=sys.stderr)
        finally:
            db.close()
    except Exception as e:
        print("Error in background file processing:", e, file=sys.stderr)
        db = SessionLocal()
        try:
            upload_record = db.query(AudioFile).filter(AudioFile.file_id == upload_id).first()
            if upload_record:
                upload_record.upload_status = "error"
                db.commit()
        except Exception as ex:
            db.rollback()
            print("DB error updating upload error:", ex, file=sys.stderr)
        finally:
            db.close()
