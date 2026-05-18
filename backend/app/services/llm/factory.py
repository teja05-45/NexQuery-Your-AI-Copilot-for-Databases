from typing import Optional
import logging
from app.services.llm.base import BaseLLMProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

_providers: dict[str, BaseLLMProvider] = {}


def get_llm_provider(provider_name: Optional[str] = None) -> BaseLLMProvider:
    """Factory function returning cached LLM provider instance."""
    name = (provider_name or settings.DEFAULT_LLM_PROVIDER).lower()

    if name not in _providers:
        if name == "groq":
            from app.services.llm.groq_provider import GroqProvider
            if not settings.GROQ_API_KEY:
                raise ValueError("GROQ_API_KEY is not configured")
            _providers[name] = GroqProvider()
        elif name in ("gemini", "google"):
            from app.services.llm.gemini_provider import GeminiProvider
            if not settings.GOOGLE_API_KEY:
                raise ValueError("GOOGLE_API_KEY is not configured")
            _providers[name] = GeminiProvider()
        else:
            raise ValueError(f"Unknown LLM provider: {name}")

        logger.info(f"Initialized LLM provider: {name}")

    return _providers[name]
