"""
Integration tests for AI SQL Assistant API.
Run with: pytest tests/ -v
"""
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import init_db, engine, Base


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    """Create test database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
async def auth_headers(client):
    """Register a test user and return auth headers."""
    reg = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123",
        "full_name": "Test User",
    })
    assert reg.status_code == 201
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ── Health ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_check(client):
    res = await client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


# ── Auth ───────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_user(client):
    res = await client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "securepassword",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "newuser@example.com"


@pytest.mark.asyncio
async def test_register_duplicate_email(client, auth_headers):
    res = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "anotheruser",
        "password": "password123",
    })
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_login(client):
    # Register first
    await client.post("/api/v1/auth/register", json={
        "email": "login_test@example.com",
        "username": "logintest",
        "password": "mypassword123",
    })
    # Then login
    res = await client.post("/api/v1/auth/login", json={
        "email": "login_test@example.com",
        "password": "mypassword123",
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    res = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client, auth_headers):
    res = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client):
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "refresh@example.com",
        "username": "refreshuser",
        "password": "password123",
    })
    refresh_token = reg.json()["refresh_token"]

    res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    assert "access_token" in res.json()


# ── Conversations ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_conversation(client, auth_headers):
    res = await client.post(
        "/api/v1/conversations",
        json={"title": "Test Conversation"},
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Test Conversation"
    assert data["id"] is not None


@pytest.mark.asyncio
async def test_list_conversations(client, auth_headers):
    res = await client.get("/api/v1/conversations", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "conversations" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_conversation(client, auth_headers):
    # Create first
    create_res = await client.post(
        "/api/v1/conversations",
        json={"title": "Get Test"},
        headers=auth_headers,
    )
    conv_id = create_res.json()["id"]

    # Get it
    res = await client.get(f"/api/v1/conversations/{conv_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["id"] == conv_id


@pytest.mark.asyncio
async def test_rename_conversation(client, auth_headers):
    create_res = await client.post(
        "/api/v1/conversations",
        json={"title": "Original Title"},
        headers=auth_headers,
    )
    conv_id = create_res.json()["id"]

    res = await client.put(
        f"/api/v1/conversations/{conv_id}",
        json={"title": "Renamed Title"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["title"] == "Renamed Title"


@pytest.mark.asyncio
async def test_delete_conversation(client, auth_headers):
    create_res = await client.post(
        "/api/v1/conversations",
        json={"title": "To Delete"},
        headers=auth_headers,
    )
    conv_id = create_res.json()["id"]

    res = await client.delete(f"/api/v1/conversations/{conv_id}", headers=auth_headers)
    assert res.status_code == 204

    # Should 404 now
    get_res = await client.get(f"/api/v1/conversations/{conv_id}", headers=auth_headers)
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_cannot_access_other_users_conversation(client, auth_headers):
    # Create a second user
    reg2 = await client.post("/api/v1/auth/register", json={
        "email": "user2@example.com",
        "username": "user2",
        "password": "password123",
    })
    headers2 = {"Authorization": f"Bearer {reg2.json()['access_token']}"}

    # User1 creates conversation
    create_res = await client.post(
        "/api/v1/conversations",
        json={"title": "Private Conv"},
        headers=auth_headers,
    )
    conv_id = create_res.json()["id"]

    # User2 tries to access
    res = await client.get(f"/api/v1/conversations/{conv_id}", headers=headers2)
    assert res.status_code == 404


# ── Messages ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_messages_empty(client, auth_headers):
    create_res = await client.post(
        "/api/v1/conversations",
        json={"title": "Empty Conv"},
        headers=auth_headers,
    )
    conv_id = create_res.json()["id"]

    res = await client.get(f"/api/v1/conversations/{conv_id}/messages", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == []


# ── File Upload ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_upload_txt_file(client, auth_headers):
    content = b"This is a test document with some content for testing."
    files = {"file": ("test.txt", content, "text/plain")}
    res = await client.post(
        "/api/v1/files/upload",
        files=files,
        headers=auth_headers,
        params={"auto_index": "false"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["original_filename"] == "test.txt"
    assert data["file_type"] == "txt"


@pytest.mark.asyncio
async def test_upload_invalid_extension(client, auth_headers):
    files = {"file": ("evil.exe", b"malware", "application/octet-stream")}
    res = await client.post("/api/v1/files/upload", files=files, headers=auth_headers)
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_list_files(client, auth_headers):
    res = await client.get("/api/v1/files", headers=auth_headers)
    assert res.status_code == 200
    assert "files" in res.json()


@pytest.mark.asyncio
async def test_delete_file(client, auth_headers):
    # Upload first
    files = {"file": ("delete_me.txt", b"delete this", "text/plain")}
    upload_res = await client.post(
        "/api/v1/files/upload",
        files=files,
        headers=auth_headers,
        params={"auto_index": "false"},
    )
    file_id = upload_res.json()["id"]

    # Delete
    res = await client.delete(f"/api/v1/files/{file_id}", headers=auth_headers)
    assert res.status_code == 204
