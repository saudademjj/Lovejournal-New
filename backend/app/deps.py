from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from . import auth
from .auth import decode_token
from .database import get_session
from .models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload:
        raise credentials_exception
    user_id: int | None = payload.get("sub")
    if not user_id:
        raise credentials_exception
    user = await auth.get_user_by_id(session, int(user_id))
    if user is None:
        raise credentials_exception
    return user
