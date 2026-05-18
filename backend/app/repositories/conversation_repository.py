from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import selectinload
from typing import Optional, List, Tuple

from app.models.conversation import Conversation, ConversationStatus
from app.models.message import Message


class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, title: str = "New Conversation", **kwargs) -> Conversation:
        conv = Conversation(user_id=user_id, title=title, **kwargs)
        self.db.add(conv)
        await self.db.flush()
        await self.db.refresh(conv)
        return conv

    async def get_by_id(self, conv_id: int, user_id: int) -> Optional[Conversation]:
        result = await self.db.execute(
            select(Conversation).where(
                Conversation.id == conv_id,
                Conversation.user_id == user_id,
                Conversation.status != ConversationStatus.DELETED,
            )
        )
        return result.scalar_one_or_none()

    async def get_with_messages(self, conv_id: int, user_id: int) -> Optional[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(
                Conversation.id == conv_id,
                Conversation.user_id == user_id,
                Conversation.status != ConversationStatus.DELETED,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self, user_id: int, page: int = 1, page_size: int = 20, search: Optional[str] = None
    ) -> Tuple[List[Conversation], int]:
        query = select(Conversation).where(
            Conversation.user_id == user_id,
            Conversation.status != ConversationStatus.DELETED,
        )
        if search:
            query = query.where(Conversation.title.ilike(f"%{search}%"))

        # Count total
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar() or 0

        # Paginate and order
        query = (
            query.order_by(Conversation.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.db.execute(query)
        return result.scalars().all(), total

    async def update(self, conv_id: int, user_id: int, **kwargs) -> Optional[Conversation]:
        await self.db.execute(
            update(Conversation)
            .where(Conversation.id == conv_id, Conversation.user_id == user_id)
            .values(**kwargs)
        )
        return await self.get_by_id(conv_id, user_id)

    async def delete(self, conv_id: int, user_id: int) -> bool:
        result = await self.db.execute(
            update(Conversation)
            .where(Conversation.id == conv_id, Conversation.user_id == user_id)
            .values(status=ConversationStatus.DELETED)
        )
        return result.rowcount > 0

    async def increment_message_count(self, conv_id: int) -> None:
        await self.db.execute(
            update(Conversation)
            .where(Conversation.id == conv_id)
            .values(message_count=Conversation.message_count + 1)
        )

    async def update_title(self, conv_id: int, title: str) -> None:
        await self.db.execute(
            update(Conversation).where(Conversation.id == conv_id).values(title=title)
        )


class MessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, conversation_id: int, role: str, content: str, **kwargs) -> Message:
        message = Message(conversation_id=conversation_id, role=role, content=content, **kwargs)
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def get_by_conversation(
        self, conversation_id: int, limit: int = 50, offset: int = 0
    ) -> List[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_recent_context(self, conversation_id: int, limit: int = 10) -> List[Message]:
        """Get last N messages for LLM context window."""
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id, Message.is_error == False)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = result.scalars().all()
        return list(reversed(messages))

    async def update(self, message_id: int, **kwargs) -> Optional[Message]:
        await self.db.execute(
            update(Message).where(Message.id == message_id).values(**kwargs)
        )
        result = await self.db.execute(select(Message).where(Message.id == message_id))
        return result.scalar_one_or_none()
