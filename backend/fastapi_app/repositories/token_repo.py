import datetime
from sqlalchemy.orm import Session
from fastapi_app.models import SessionToken

def store_token(db: Session, token: str, user_id, expires_at: datetime.datetime):
    session_token = SessionToken(user_id=user_id, token=token, expires_at=expires_at)
    db.add(session_token)
    db.commit()

def remove_token(db: Session, token: str):
    session_token = db.query(SessionToken).filter(SessionToken.token == token).first()
    if session_token:
        db.delete(session_token)
        db.commit()

def is_token_valid(db: Session, token: str) -> bool:
    session_token = db.query(SessionToken).filter(SessionToken.token == token).first()
    return bool(session_token and session_token.expires_at > datetime.datetime.utcnow())
