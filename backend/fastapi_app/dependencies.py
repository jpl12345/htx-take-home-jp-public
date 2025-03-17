import datetime
from fastapi import Depends, HTTPException, Request, Cookie, status
from sqlalchemy.orm import Session
from fastapi_app.database import get_db
from fastapi_app.models import User, SessionToken

def get_token_from_cookie(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return token

def get_current_user(token: str = Depends(get_token_from_cookie), db: Session = Depends(get_db)) -> User:
    session_token = db.query(SessionToken).filter(SessionToken.token == token).first()
    if not session_token or session_token.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    user = db.query(User).filter(User.user_id == session_token.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found for this session")
    return user

def admin_required(current_user: User = Depends(get_current_user)):
    if current_user.account_type != "superuser":
        raise HTTPException(status_code=403, detail="Not authorized as admin")
    return current_user
