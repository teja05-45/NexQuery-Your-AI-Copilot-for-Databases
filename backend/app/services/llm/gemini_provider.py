from typing import AsyncGenerator, List
import logging
import google.generativeai as genai
from app.services.llm.base import BaseLLMProvider, LLMMessage, LLMResponse
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model_name = settings.GEMINI_MODEL
        self.model = genai.GenerativeModel(self.model_name)

    def _convert_messages(self, messages: List[LLMMessage]) -> List[dict]:
        """Convert to Gemini format."""
        gemini_messages = []
        for m in messages:
            role = "user" if m.role == "user" else "model"
            if m.role == "system":
                # Gemini doesn't have system role natively; prepend to first user message
                continue
            gemini_messages.append({"role": role, "parts": [m.content]})
        return gemini_messages

    def _extract_system(self, messages: List[LLMMessage]) -> str:
        for m in messages:
            if m.role == "system":
                return m.content
        return ""

    async def chat(
        self,
        messages: List[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> LLMResponse:
        try:
            system_prompt = self._extract_system(messages)
            chat_messages = self._convert_messages(messages)

            model = genai.GenerativeModel(
                self.model_name,
                system_instruction=system_prompt if system_prompt else None,
            )

            generation_config = genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )

            # Build chat history (all but last)
            history = chat_messages[:-1] if len(chat_messages) > 1 else []
            last_message = chat_messages[-1]["parts"][0] if chat_messages else ""

            chat = model.start_chat(history=history)
            response = await chat.send_message_async(
                last_message, generation_config=generation_config
            )

            usage = response.usage_metadata
            return LLMResponse(
                content=response.text,
                model=self.model_name,
                prompt_tokens=usage.prompt_token_count if usage else 0,
                completion_tokens=usage.candidates_token_count if usage else 0,
                total_tokens=usage.total_token_count if usage else 0,
            )
        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            raise

    async def stream_chat(
        self,
        messages: List[LLMMessage],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        try:
            system_prompt = self._extract_system(messages)
            chat_messages = self._convert_messages(messages)

            model = genai.GenerativeModel(
                self.model_name,
                system_instruction=system_prompt if system_prompt else None,
            )
            generation_config = genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            )

            history = chat_messages[:-1] if len(chat_messages) > 1 else []
            last_message = chat_messages[-1]["parts"][0] if chat_messages else ""

            chat = model.start_chat(history=history)
            response = await chat.send_message_async(
                last_message,
                generation_config=generation_config,
                stream=True,
            )

            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            logger.error(f"Gemini stream error: {e}")
            raise

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        try:
            embeddings = []
            for text in texts:
                result = genai.embed_content(
                    model="models/embedding-001",
                    content=text,
                    task_type="retrieval_document",
                )
                embeddings.append(result["embedding"])
            return embeddings
        except Exception as e:
            logger.error(f"Gemini embedding error: {e}")
            raise
