import datetime, secrets
from fastapi import APIRouter, Depends, HTTPException, Response, Request, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi_app.schemas import UserOut
from fastapi_app.database import get_db
from fastapi_app.repositories.user_repo import get_user_by_username
from fastapi_app.repositories.token_repo import store_token, remove_token, is_token_valid
from fastapi_app.utils import verify_password
from fastapi_app.models import SessionToken, User
from fastapi_app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from fastapi_app.dependencies import get_current_user, get_token_from_cookie

router = APIRouter()

# POST /login : Login endpoint using session-based auth.
@router.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # Update last_logged_in
    user.last_logged_in = datetime.datetime.now()
    db.commit()

    # Remove any previous sessions for this user.
    db.query(SessionToken).filter(SessionToken.user_id == user.user_id).delete()
    db.commit()

    # Generate a new session token.
    session_token = secrets.token_urlsafe(32)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    store_token(db, session_token, user.user_id, expires_at)

    # Set session cookie.
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return {"message": "Login successful"}

# GET /me : Retrieve current user info.
@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user

# GET /auth-status : Check authentication status.
@router.get("/auth-status")
def auth_status(session_token: str = Cookie(None), db: Session = Depends(get_db)):
    if session_token and is_token_valid(db, session_token):
        return {"authenticated": True}
    return Response(status_code=401)

# POST /logout : Logout endpoint.
@router.post("/logout")
def logout(response: Response, db: Session = Depends(get_db), token: str = Depends(get_token_from_cookie)):
    remove_token(db, token)
    response.delete_cookie("session_token")
    return {"message": "Logged out successfully"}
