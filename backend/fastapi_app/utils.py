# app/utils.py
import datetime, jwt, os, uuid, hashlib, aiofiles, secrets
from fastapi import HTTPException
from passlib.context import CryptContext
from fastapi_app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, MAX_FILE_SIZE, UPLOAD_DIR, AWS_ACCESS_KEY, AWS_SECRET_KEY, BUCKET_NAME
import boto3

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: datetime.timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Synchronous S3 client - for generating pre-signed URLs
s3 = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY
)

# Helper to save an uploaded file and compute its MD5 checksum.
async def save_file_to_disk_and_checksum(file) -> (str, str):
    file_location = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    md5_hash = hashlib.md5()
    total_bytes = 0
    async with aiofiles.open(file_location, "wb") as out_file:
        while True:
            chunk = await file.read(1024 * 1024)  # 1 MB chunks
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > MAX_FILE_SIZE:
                await out_file.close()
                os.remove(file_location)
                raise HTTPException(status_code=400, detail="File size exceeds the maximum allowed limit of 1GB")
            await out_file.write(chunk)
            md5_hash.update(chunk)
    checksum = md5_hash.hexdigest()
    return file_location, checksum