import logging
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    verify_password, create_access_token, create_refresh_token, verify_refresh_token
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserCreate, UserLogin, TokenResponse, UserResponse
from app.models.user import User

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def register(self, data: UserCreate) -> TokenResponse:
        # Check uniqueness
        if await self.user_repo.email_exists(data.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if await self.user_repo.username_exists(data.username):
            raise HTTPException(status_code=400, detail="Username already taken")

        user = await self.user_repo.create(
            email=data.email,
            username=data.username,
            password=data.password,
            full_name=data.full_name,
        )
        logger.info(f"New user registered: {user.email}")
        return self._create_token_response(user)

    async def login(self, data: UserLogin) -> TokenResponse:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")

        try:
            await self.user_repo.update_last_login(user.id)
        except Exception as e:
            # Log but don't fail login on database lock or other transient errors
            logger.warning(f"Failed to update last_login for user {user.id}: {e}")
        
        logger.info(f"User logged in: {user.email}")
        return self._create_token_response(user)

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        payload = verify_refresh_token(refresh_token)
        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(int(user_id))
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        return self._create_token_response(user)

    def _create_token_response(self, user: User) -> TokenResponse:
        token_data = {"sub": str(user.id), "email": user.email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse.model_validate(user),
        )
