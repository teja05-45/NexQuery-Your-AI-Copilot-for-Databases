from fastapi import APIRouter
from app.services.redis_service import redis_service
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "redis": "connected" if redis_service.is_connected else "disconnected",
    }
