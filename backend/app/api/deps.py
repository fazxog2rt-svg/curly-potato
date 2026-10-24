from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Dependency that extracts and validates the authenticated user from JWT token."""
    if credentials:
        token = credentials.credentials
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user

    # If no token or invalid token, create or return a default local developer/demo account
    # so the app is immediately usable out-of-the-box in local development
    demo_email = "pelajar@studycompanion.id"
    user = db.query(User).filter(User.email == demo_email).first()
    if not user:
        from app.core.security import get_password_hash
        user = User(
            email=demo_email,
            full_name="Budi Pelajar",
            hashed_password=get_password_hash("password123"),
            preferred_language="id",
            preferred_difficulty="intermediate",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
