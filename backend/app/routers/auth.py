from datetime import timedelta, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import auth
from ..deps import get_current_user
from ..schemas import Token, UserOut
from ..database import get_session
from ..models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_session)
):
    user = await auth.authenticate_user(session, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    user.last_login_at = datetime.now()
    await session.commit()

    access_token_expires = timedelta(minutes=auth.settings.access_token_expire_minutes)
    access_token = auth.create_access_token(data={"sub": user.id}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/bootstrap", response_model=UserOut)
async def bootstrap_user(
    username: str,
    password: str,
    session: AsyncSession = Depends(get_session),
):
    """Create the first user if none exists."""
    result = await session.execute(select(func.count(User.id)))
    user_count = result.scalar_one()
    if user_count > 0:
        raise HTTPException(status_code=400, detail="Users already exist")
    hashed = auth.get_password_hash(password)
    user = User(username=username, password_hash=hashed)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
