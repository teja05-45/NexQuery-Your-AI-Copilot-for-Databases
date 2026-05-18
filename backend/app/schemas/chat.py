from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    llm_provider: Optional[str] = "groq"
    model_name: Optional[str] = None


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None


class ConversationResponse(BaseModel):
    id: int
    title: str
    status: str
    llm_provider: str
    model_name: Optional[str] = None
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    conversations: List[ConversationResponse]
    total: int
    page: int
    page_size: int


class MessageCreate(BaseModel):
    content: str
    stream: Optional[bool] = False


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    sources: Optional[List[Dict[str, Any]]] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    latency_ms: Optional[float] = None
    model_name: Optional[str] = None
    audio_url: Optional[str] = None
    is_error: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str
    stream: Optional[bool] = True
    llm_provider: Optional[str] = None
    model_name: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: int
    message: MessageResponse
    conversation_title: str


class StreamChunk(BaseModel):
    type: str  # 'chunk' | 'done' | 'error'
    content: Optional[str] = None
    error: Optional[str] = None
    conversation_id: Optional[int] = None
    message_id: Optional[int] = None
