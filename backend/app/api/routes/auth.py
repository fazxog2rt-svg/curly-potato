from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, TokenResponse, GoogleAuthRequest
from app.api.deps import get_current_user
import base64
import json
import secrets

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/google", response_model=TokenResponse)
def google_auth(auth_in: GoogleAuthRequest, db: Session = Depends(get_db)):
    email = auth_in.email
    full_name = auth_in.full_name or "Pelajar Google"

    # If raw credential JWT token is passed from Google One Tap / Google Identity Services
    if auth_in.credential and not email:
        try:
            parts = auth_in.credential.split(".")
            if len(parts) >= 2:
                padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                decoded = base64.b64decode(padded)
                jwt_data = json.loads(decoded.decode("utf-8"))
                email = jwt_data.get("email")
                full_name = jwt_data.get("name") or jwt_data.get("given_name") or full_name
        except Exception:
            pass

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Autentikasi Google gagal: Email tidak ditemukan.",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        random_pass = secrets.token_urlsafe(16)
        user = User(
            email=email,
            hashed_password=get_password_hash(random_pass),
            full_name=full_name,
            preferred_language="id",
            preferred_difficulty="intermediate",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))



@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar. Silakan gunakan email lain atau masuk.",
        )

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        preferred_language=user_in.preferred_language or "id",
        preferred_difficulty=user_in.preferred_difficulty or "intermediate",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau kata sandi tidak cocok.",
        )

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_profile(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if update_in.full_name is not None:
        current_user.full_name = update_in.full_name
    if update_in.preferred_language is not None:
        current_user.preferred_language = update_in.preferred_language
    if update_in.preferred_difficulty is not None:
        current_user.preferred_difficulty = update_in.preferred_difficulty
    if update_in.memory_enabled is not None:
        current_user.memory_enabled = update_in.memory_enabled

    db.commit()
    db.refresh(current_user)
    return current_user
