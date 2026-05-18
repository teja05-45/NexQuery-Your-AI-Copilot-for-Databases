from typing import Optional


SYSTEM_PROMPT = """You are an AI SQL Assistant, a helpful and accurate AI that generates SQL queries from natural language descriptions.
You provide clear, well-structured SQL code. You can analyze database schemas, generate queries, and explain SQL concepts.
Always be concise but complete. Format SQL code with proper syntax highlighting.
Ensure generated SQL is safe and follows best practices."""


def build_system_prompt(custom_instructions: Optional[str] = None) -> str:
    base = SYSTEM_PROMPT
    if custom_instructions:
        return f"{base}\n\nAdditional instructions: {custom_instructions}"
    return base


def build_title_prompt(first_message: str) -> str:
    return f"""Generate a short, descriptive title (max 6 words) for a conversation that starts with:
"{first_message[:200]}"

Respond with ONLY the title, no quotes, no explanation."""


def build_summary_prompt(messages_text: str) -> str:
    return f"""Summarize the following conversation in 2-3 sentences:

{messages_text}

Provide only the summary, no preamble."""
