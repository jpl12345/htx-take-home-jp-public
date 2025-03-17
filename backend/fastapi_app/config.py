import os, secrets
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))  # 7 days
ALLOWED_ORIGINS = [os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")]
ALLOWED_AUDIO_MIME_TYPES = {"audio/mpeg", "audio/wav", "audio/mp3", "audio/ogg", "application/ogg", "audio/x-wav"}
MAX_FILE_SIZE = 1073741824  # 1GB

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
BUCKET_NAME = "fastapifiles-audio-987dbx"

# Directory for temporarily storing uploaded files
UPLOAD_DIR = "./uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
