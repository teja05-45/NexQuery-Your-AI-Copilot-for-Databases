import time
import logging
from typing import AsyncGenerator, List, Optional, Dict, Any, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.conversation_repository import ConversationRepository, MessageRepository
from app.services.llm.factory import get_llm_provider
from app.services.llm.base import LLMMessage
from app.services.redis_service import redis_service
from app.prompts.templates import build_system_prompt, build_title_prompt
from app.schemas.chat import ChatRequest
from app.models.conversation import Conversation
from app.models.message import Message

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.conv_repo = ConversationRepository(db)
        self.msg_repo = MessageRepository(db)

    async def _get_or_create_conversation(
        self, user_id: int, request: ChatRequest
    ) -> Conversation:
        if request.conversation_id:
            conv = await self.conv_repo.get_by_id(request.conversation_id, user_id)
            if not conv:
                raise ValueError("Conversation not found")
            return conv

        conv = await self.conv_repo.create(
            user_id=user_id,
            title="New Conversation",
            llm_provider=request.llm_provider or "groq",
            model_name=request.model_name,
        )
        return conv

    async def _build_messages(
        self,
        conversation_id: int,
        user_message: str,
    ) -> List[LLMMessage]:
        """Build the full message list including history for the LLM."""
        # Try Redis cache first for conversation memory
        cached = await redis_service.get_conversation_memory(conversation_id)
        if cached:
            history = [LLMMessage(role=m["role"], content=m["content"]) for m in cached]
        else:
            db_messages = await self.msg_repo.get_recent_context(conversation_id, limit=10)
            history = [LLMMessage(role=m.role, content=m.content) for m in db_messages]
            # Cache for next request
            await redis_service.save_conversation_memory(
                conversation_id, [{"role": m.role, "content": m.content} for m in db_messages]
            )

        system_prompt = build_system_prompt()
        messages = [LLMMessage(role="system", content=system_prompt)]
        messages.extend(history)

        messages.append(LLMMessage(role="user", content=user_message))
        return messages

    async def _retrieve_rag_context(
        self, user_id: int, query: str, file_ids: List[int]
    ) -> Tuple[str, List[Dict]]:
        """Run RAG retrieval across user's indexed files."""
        pipeline = RAGPipeline()
        all_results = []

        if file_ids:
            for fid in file_ids:
                file = await self.file_repo.get_by_id(fid, user_id)
                if file and file.is_indexed and file.collection_name:
                    results = await pipeline.retrieve_context(
                        query, file.collection_name, top_k=3
                    )
                    all_results.extend(results)
        else:
            # Search across all indexed files for this user
            indexed_files = await self.file_repo.get_indexed_files(user_id)
            for file in indexed_files[:5]:  # Limit to 5 files
                if file.collection_name:
                    results = await pipeline.retrieve_context(
                        query, file.collection_name, top_k=2
                    )
                    all_results.extend(results)

        # Sort by score and take top results
        all_results.sort(key=lambda x: x.score, reverse=True)
        top_results = all_results[:5]

        context = pipeline.build_rag_context(top_results)
        sources = pipeline.format_sources(top_results)
    async def _auto_generate_title(self, conv_id: int, user_message: str, provider_name: str):
        """Generate a conversation title from the first message."""
        try:
            provider = get_llm_provider(provider_name)
            title_prompt = build_title_prompt(user_message)
            response = await provider.chat(
                [LLMMessage(role="user", content=title_prompt)],
                temperature=0.3,
                max_tokens=20,
            )
            title = response.content.strip().strip('"').strip("'")[:100]
            if title:
                await self.conv_repo.update_title(conv_id, title)
        except Exception as e:
            logger.warning(f"Auto-title generation failed: {e}")

    async def chat(
        self, user_id: int, request: ChatRequest
    ) -> Tuple[Conversation, Message, Message]:
        """Non-streaming chat. Returns (conversation, user_message, assistant_message)."""
        conv = await self._get_or_create_conversation(user_id, request)
        provider_name = request.llm_provider or conv.llm_provider or "groq"

        # Save user message
        user_msg = await self.msg_repo.create(
            conversation_id=conv.id, role="user", content=request.message
        )
        await self.conv_repo.increment_message_count(conv.id)

        # Auto-title on first message
        if conv.message_count <= 1:
            await self._auto_generate_title(conv.id, request.message, provider_name)

        # Build messages for LLM
        messages = await self._build_messages(
            conv.id, request.message
        )

        # Call LLM
        start_time = time.time()
        try:
            provider = get_llm_provider(provider_name)
            response = await provider.chat(messages)
            latency_ms = (time.time() - start_time) * 1000

            # Save assistant message
            assistant_msg = await self.msg_repo.create(
                conversation_id=conv.id,
                role="assistant",
                content=response.content,
                prompt_tokens=response.prompt_tokens,
                completion_tokens=response.completion_tokens,
                total_tokens=response.total_tokens,
                latency_ms=latency_ms,
                model_name=response.model,
            )
            await self.conv_repo.increment_message_count(conv.id)

            # Invalidate Redis memory cache so next call gets updated history
            await redis_service.clear_conversation_memory(conv.id)

            # Refresh conversation for latest title
            conv = await self.conv_repo.get_by_id(conv.id, user_id)
            return conv, user_msg, assistant_msg

        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            error_msg = await self.msg_repo.create(
                conversation_id=conv.id,
                role="assistant",
                content="I apologize, but I encountered an error processing your request. Please try again.",
                is_error=True,
                error_message=str(e),
            )
            await self.conv_repo.increment_message_count(conv.id)
            conv = await self.conv_repo.get_by_id(conv.id, user_id)
            return conv, user_msg, error_msg

    async def stream_chat(
        self, user_id: int, request: ChatRequest
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Streaming chat - yields SSE-compatible dicts."""
        conv = await self._get_or_create_conversation(user_id, request)
        provider_name = request.llm_provider or conv.llm_provider or "groq"

        # Save user message
        user_msg = await self.msg_repo.create(
            conversation_id=conv.id, role="user", content=request.message
        )
        await self.conv_repo.increment_message_count(conv.id)

        # Auto-title on first message
        if conv.message_count <= 1:
            await self._auto_generate_title(conv.id, request.message, provider_name)
            conv = await self.conv_repo.get_by_id(conv.id, user_id)

        # Yield conversation info first
        yield {
            "type": "meta",
            "conversation_id": conv.id,
            "conversation_title": conv.title,
        }

        # Build messages
        messages = await self._build_messages(
            conv.id, request.message
        )

        # Stream LLM response
        full_content = ""
        start_time = time.time()
        try:
            provider = get_llm_provider(provider_name)
            async for chunk in provider.stream_chat(messages):
                full_content += chunk
                yield {"type": "chunk", "content": chunk}

            latency_ms = (time.time() - start_time) * 1000

            # Save completed assistant message
            assistant_msg = await self.msg_repo.create(
                conversation_id=conv.id,
                role="assistant",
                content=full_content,
                latency_ms=latency_ms,
                model_name=provider_name,
            )
            await self.conv_repo.increment_message_count(conv.id)
            await redis_service.clear_conversation_memory(conv.id)

            yield {"type": "done", "message_id": assistant_msg.id}

        except Exception as e:
            logger.error(f"Stream LLM error: {e}")
            yield {"type": "error", "error": str(e)}
