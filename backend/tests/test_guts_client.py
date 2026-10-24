import pytest
from app.ai.guts_client import GutsAIClient, GutsAIError


def test_health_endpoint(client):
    """Test health check returns healthy status without leaking secrets."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "api_key" not in data
    assert "secret" not in data


@pytest.mark.asyncio
async def test_guts_client_missing_key():
    """Test that GutsAIClient properly raises GutsAIError when API key is missing."""
    client = GutsAIClient(api_key="")
    with pytest.raises(GutsAIError) as exc_info:
        await client.chat_completion(messages=[{"role": "user", "content": "Halo"}])
    assert exc_info.value.status_code == 401
    assert "belum dikonfigurasi" in exc_info.value.message


@pytest.mark.asyncio
async def test_guts_client_fallback_models():
    """Test model listing fallback returns production models when unauthenticated."""
    client = GutsAIClient(api_key="")
    models = await client.list_models()
    assert len(models) >= 5
    model_ids = [m["id"] for m in models]
    assert "gemini-3.8-flash" in model_ids
