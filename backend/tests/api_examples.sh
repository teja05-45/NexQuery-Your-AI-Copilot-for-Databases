# RAGChat API — Testing Examples
# Base URL: http://localhost:8000/api/v1

BASE="http://localhost:8000/api/v1"


# ── 1. HEALTH CHECK ───────────────────────────────────────────────────────────

curl -s "$BASE/health" | python3 -m json.tool


# ── 2. AUTHENTICATION ─────────────────────────────────────────────────────────

# Register
curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","username":"demo","password":"demo1234","full_name":"Demo User"}' \
  | python3 -m json.tool

# Login (save token)
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "Token: $TOKEN"

# Get current user
curl -s "$BASE/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

# Refresh token
REFRESH=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo1234"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])")

curl -s -X POST "$BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH\"}" \
  | python3 -m json.tool


# ── 3. CONVERSATIONS ──────────────────────────────────────────────────────────

# Create conversation
CONV=$(curl -s -X POST "$BASE/conversations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Chat","llm_provider":"openai"}' \
  | python3 -m json.tool)

echo "$CONV"

CONV_ID=$(echo "$CONV" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# List conversations
curl -s "$BASE/conversations?page=1&page_size=10" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

# Rename conversation
curl -s -X PUT "$BASE/conversations/$CONV_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Renamed Chat"}' \
  | python3 -m json.tool

# Get messages
curl -s "$BASE/conversations/$CONV_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool


# ── 4. CHAT (non-streaming) ───────────────────────────────────────────────────

curl -s -X POST "$BASE/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": $CONV_ID,
    \"message\": \"What is retrieval-augmented generation?\",
    \"use_rag\": false,
    \"stream\": false
  }" \
  | python3 -m json.tool


# ── 5. CHAT STREAMING (SSE) ───────────────────────────────────────────────────

curl -s -X POST "$BASE/chat/stream" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d "{
    \"conversation_id\": $CONV_ID,
    \"message\": \"Explain transformers in AI briefly\",
    \"stream\": true
  }"


# ── 6. FILE UPLOAD & RAG ──────────────────────────────────────────────────────

# Upload a text file
echo "RAGChat is an AI-powered document chat application built with FastAPI and React.
It supports PDF, TXT, CSV, and DOCX documents.
The RAG pipeline uses FAISS for vector search and supports OpenAI and Gemini." > /tmp/sample.txt

FILE_RES=$(curl -s -X POST "$BASE/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/sample.txt" \
  -F "auto_index=true" \
  | python3 -m json.tool)

echo "$FILE_RES"
FILE_ID=$(echo "$FILE_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# List files
curl -s "$BASE/files" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

# Check file status
curl -s "$BASE/files/$FILE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

# Manually trigger indexing if needed
curl -s -X POST "$BASE/files/$FILE_ID/index" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

# Chat with RAG enabled
curl -s -X POST "$BASE/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": $CONV_ID,
    \"message\": \"What documents does RAGChat support?\",
    \"use_rag\": true,
    \"file_ids\": [$FILE_ID],
    \"stream\": false
  }" \
  | python3 -m json.tool


# ── 7. VOICE ──────────────────────────────────────────────────────────────────

# Text to Speech
curl -s -X POST "$BASE/voice/synthesize" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello! I am RAGChat, your AI assistant."}' \
  | python3 -m json.tool

# Speech to Text (requires an audio file)
# curl -s -X POST "$BASE/voice/transcribe" \
#   -H "Authorization: Bearer $TOKEN" \
#   -F "audio=@/path/to/audio.webm"


# ── 8. SEARCH CONVERSATIONS ───────────────────────────────────────────────────

curl -s "$BASE/conversations?search=RAG&page=1&page_size=10" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool


# ── 9. DELETE CONVERSATION ───────────────────────────────────────────────────

curl -s -X DELETE "$BASE/conversations/$CONV_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -w "HTTP %{http_code}\n"


# ── 10. LOGOUT ────────────────────────────────────────────────────────────────

curl -s -X POST "$BASE/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -w "HTTP %{http_code}\n"
