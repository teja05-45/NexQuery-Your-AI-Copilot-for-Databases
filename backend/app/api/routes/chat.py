import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, MessageResponse
from app.services.chat_service import ChatService
from app.services.redis_service import redis_service

router = APIRouter(prefix="/chat", tags=["Chat"])
logger = logging.getLogger(__name__)


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Non-streaming chat endpoint."""
    # Rate limiting
    allowed = await redis_service.check_rate_limit(current_user.id)
    if not allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait.")

    service = ChatService(db)
    request.stream = False
    conv, user_msg, assistant_msg = await service.chat(current_user.id, request)

    return ChatResponse(
        conversation_id=conv.id,
        message=MessageResponse.model_validate(assistant_msg),
        conversation_title=conv.title,
    )


@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Streaming chat via Server-Sent Events."""
    allowed = await redis_service.check_rate_limit(current_user.id)
    if not allowed:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait.")

    service = ChatService(db)

    async def event_generator():
        try:
            async for chunk in service.stream_chat(current_user.id, request):
                data = json.dumps(chunk)
                yield f"data: {data}\n\n"
        except Exception as e:
            logger.error(f"SSE stream error: {e}")
            error_data = json.dumps({"type": "error", "error": str(e)})
            yield f"data: {error_data}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
