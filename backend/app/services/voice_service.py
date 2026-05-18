"""
Voice Service — STT + TTS
─────────────────────────
STT backends tried in order (all free, all local, zero C++ compilation):
  1. vosk        — best offline option, pure Python wheel
  2. SpeechRecognition + Google Web Speech — needs internet, still free
  3. 503 returned if nothing is available

TTS:
  gTTS — free, uses Google's public TTS endpoint (no API key)
"""
import io
import os
import uuid
import wave
import logging
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import UploadFile, HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── STT backend detection (done once at import time) ──────────────────────────

def _detect_stt_backend() -> str:
    try:
        import vosk  # noqa
        return "vosk"
    except ImportError:
        pass
    try:
        import speech_recognition  # noqa
        return "speech_recognition"
    except ImportError:
        pass
    return "none"


_STT_BACKEND = _detect_stt_backend()
logger.info(f"STT backend detected: {_STT_BACKEND}")


class VoiceService:
    def __init__(self):
        self.audio_dir = Path(settings.UPLOAD_DIR) / "audio"
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        self._vosk_model = None  # lazy-loaded

    # ── Public: Speech-to-Text ────────────────────────────────────────────────

    async def speech_to_text(self, audio_file: UploadFile) -> str:
        if _STT_BACKEND == "none":
            raise HTTPException(
                status_code=501,
                detail=(
                    "No STT backend installed. Run:\n"
                    "  pip install vosk\n"
                    "Vosk is free, offline, and requires no API key or C++ compiler."
                ),
            )

        content = await audio_file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty audio file received")

        suffix = Path(audio_file.filename or "audio.webm").suffix.lower() or ".webm"

        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            if _STT_BACKEND == "vosk":
                return await self._transcribe_vosk(tmp_path)
            else:
                return await self._transcribe_speech_recognition(tmp_path)
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    # ── Vosk (best offline option) ────────────────────────────────────────────

    def _get_vosk_model(self):
        if self._vosk_model is not None:
            return self._vosk_model

        import vosk

        # Default small English model path
        model_path = os.environ.get("VOSK_MODEL_PATH", "vosk-model-small-en-us-0.15")

        if not Path(model_path).exists():
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Vosk model not found at '{model_path}'.\n"
                    "Download a model from https://alphacephei.com/vosk/models\n"
                    "Recommended (40MB): vosk-model-small-en-us-0.15\n"
                    "Extract into your backend folder, then restart the server.\n\n"
                    "Quick download command:\n"
                    "  curl -L https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip "
                    "-o model.zip && tar -xf model.zip"
                ),
            )

        self._vosk_model = vosk.Model(model_path)
        logger.info(f"Vosk model loaded from: {model_path}")
        return self._vosk_model

    async def _transcribe_vosk(self, audio_path: str) -> str:
        try:
            import vosk
            import json

            model = self._get_vosk_model()

            # Convert to WAV (vosk needs PCM wav)
            wav_path = await _to_wav(audio_path)

            try:
                with wave.open(wav_path, "rb") as wf:
                    rec = vosk.KaldiRecognizer(model, wf.getframerate())
                    rec.SetWords(True)

                    results = []
                    while True:
                        data = wf.readframes(4000)
                        if not data:
                            break
                        if rec.AcceptWaveform(data):
                            r = json.loads(rec.Result())
                            results.append(r.get("text", ""))

                    # Final partial result
                    r = json.loads(rec.FinalResult())
                    results.append(r.get("text", ""))

                text = " ".join(t for t in results if t).strip()
                logger.info(f"Vosk transcribed: {len(text)} chars")
                return text
            finally:
                if wav_path != audio_path:
                    try:
                        os.unlink(wav_path)
                    except OSError:
                        pass

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Vosk error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")

    # ── SpeechRecognition fallback (needs internet) ───────────────────────────

    async def _transcribe_speech_recognition(self, audio_path: str) -> str:
        try:
            import speech_recognition as sr

            wav_path = await _to_wav(audio_path)
            try:
                recognizer = sr.Recognizer()
                with sr.AudioFile(wav_path) as source:
                    audio = recognizer.record(source)

                # Google Web Speech API — free, no key needed for basic use
                text = recognizer.recognize_google(audio)
                logger.info(f"SpeechRecognition transcribed: {len(text)} chars")
                return text
            finally:
                if wav_path != audio_path:
                    try:
                        os.unlink(wav_path)
                    except OSError:
                        pass

        except Exception as e:
            logger.error(f"SpeechRecognition error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")

    # ── Text-to-Speech ────────────────────────────────────────────────────────

    async def text_to_speech(self, text: str, user_id: int) -> str:
        try:
            from gtts import gTTS
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="gTTS not installed. Run: pip install gTTS",
            )

        if not text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        try:
            filename = f"{uuid.uuid4().hex}.mp3"
            file_path = self.audio_dir / filename
            gTTS(text=text[:3000], lang=settings.TTS_LANGUAGE, slow=False).save(str(file_path))
            logger.info(f"TTS saved: {filename}")
            return f"/api/v1/voice/audio/{filename}"
        except Exception as e:
            logger.error(f"TTS error: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"TTS failed: {e}")

    # ── Serve audio ───────────────────────────────────────────────────────────

    def get_audio_path(self, filename: str) -> Optional[Path]:
        resolved = (self.audio_dir / filename).resolve()
        if resolved.parent == self.audio_dir.resolve() and resolved.exists():
            return resolved
        return None


# ── Audio conversion helper ───────────────────────────────────────────────────

async def _to_wav(src_path: str) -> str:
    """
    Convert any audio format to 16-bit mono PCM WAV using pydub/ffmpeg if available,
    or return the original path if already a WAV (best-effort).
    """
    if src_path.lower().endswith(".wav"):
        return src_path

    # Try pydub (optional, requires ffmpeg)
    try:
        from pydub import AudioSegment
        audio = AudioSegment.from_file(src_path)
        audio = audio.set_channels(1).set_frame_rate(16000).set_sample_width(2)
        wav_path = src_path + ".wav"
        audio.export(wav_path, format="wav")
        return wav_path
    except Exception:
        pass

    # Try soundfile (handles many formats without ffmpeg)
    try:
        import soundfile as sf
        import numpy as np
        data, sr = sf.read(src_path, dtype="int16", always_2d=False)
        if data.ndim > 1:
            data = data[:, 0]  # take first channel
        wav_path = src_path + ".wav"
        sf.write(wav_path, data, sr, subtype="PCM_16")
        return wav_path
    except Exception:
        pass

    # Last resort: return original and hope it's close enough to WAV
    logger.warning(f"Could not convert {src_path} to WAV; passing as-is to recognizer")
    return src_path