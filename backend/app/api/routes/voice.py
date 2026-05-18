from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse as FastAPIFileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.voice_service import VoiceService

router = APIRouter(prefix="/voice", tags=["Voice"])


class STTResponse(BaseModel):
    text: str


class TTSRequest(BaseModel):
    text: str


class TTSResponse(BaseModel):
    audio_url: str


@router.post("/transcribe", response_model=STTResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Convert speech to text using Whisper."""
    service = VoiceService()
    text = await service.speech_to_text(audio)
    return STTResponse(text=text)


@router.post("/synthesize", response_model=TTSResponse)
async def synthesize_speech(
    request: TTSRequest,
    current_user: User = Depends(get_current_user),
):
    """Convert text to speech audio."""
    service = VoiceService()
    audio_url = await service.text_to_speech(request.text, current_user.id)
    return TTSResponse(audio_url=audio_url)


@router.get("/audio/{filename}")
async def serve_audio(
    filename: str,
    current_user: User = Depends(get_current_user),
):
    """Serve generated audio files."""
    service = VoiceService()
    audio_path = service.get_audio_path(filename)
    if not audio_path:
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FastAPIFileResponse(str(audio_path), media_type="audio/mpeg")
