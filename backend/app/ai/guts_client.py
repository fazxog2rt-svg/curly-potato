import json
import logging
import time
from typing import Any, AsyncGenerator, Dict, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# Prioritized verified models that are currently active and functioning
PRIORITY_MODELS = [
    "gemini-3.8-flash",
    "gpt-5.6-luna",
    "gpt-6-luna",
    "gpt-6-astra",
    "deepseek-v4-flash",
]

# Fallback verified models in case network is down or API key not yet set
FALLBACK_MODELS = [
    {"id": "gemini-3.8-flash", "name": "Gemini 3.8 Flash (Google - Cepat & Aktif)", "provider": "Google", "status": "active"},
    {"id": "gpt-5.6-luna", "name": "GPT 5.6 Luna (OpenAI - Stabil & Aktif)", "provider": "OpenAI", "status": "active"},
    {"id": "gpt-6-luna", "name": "GPT 6 Luna (OpenAI - Unggulan)", "provider": "OpenAI", "status": "active"},
    {"id": "gpt-6-astra", "name": "GPT 6 Astra (OpenAI - Lanjutan)", "provider": "OpenAI", "status": "active"},
    {"id": "deepseek-v4-flash", "name": "DeepSeek V4 Flash (DeepSeek)", "provider": "DeepSeek", "status": "active"},
    {"id": "claude-sonnet-5", "name": "Claude 5 Sonnet (Anthropic - Maintenance Provider)", "provider": "Anthropic", "status": "offline"},
]


class GutsAIError(Exception):
    """Base exception for GutsAI client errors."""
    def __init__(self, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class GutsAIClient:
    """Modular client for GutsAI gateway with OpenAI-compatible API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: Optional[int] = None,
        max_retries: Optional[int] = None,
    ):
        self.api_key = api_key if api_key is not None else settings.GUTS_API_KEY
        self.base_url = (base_url or settings.GUTSAI_BASE_URL).rstrip("/")
        self.timeout = timeout or settings.GUTSAI_TIMEOUT_SECONDS
        self.max_retries = max_retries if max_retries is not None else settings.GUTSAI_MAX_RETRIES
        self._cached_models: Optional[List[Dict[str, Any]]] = None
        self._models_cached_at: float = 0.0

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-study-companion.internal",
            "X-Guts-Title": "AI Study Companion",
            "X-Guts-Categories": "writing-assistant,general-chat",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def validate_configuration(self) -> None:
        """Validate that API key is set before making live calls."""
        if not self.api_key or not self.api_key.strip():
            raise GutsAIError(
                message="GutsAI API key belum dikonfigurasi. Silakan atur variabel GUTS_API_KEY di file .env atau pengaturan aplikasi.",
                status_code=401,
            )

    async def list_models(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Fetch available models from GutsAI with smart sorting and caching."""
        current_time = time.time()
        # Cache for 10 minutes unless force_refresh
        if not force_refresh and self._cached_models and (current_time - self._models_cached_at < 600):
            return self._cached_models

        if not self.api_key:
            return FALLBACK_MODELS

        url = f"{self.base_url}/models"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=self._get_headers())
                if response.status_code == 200:
                    data = response.json()
                    models_raw = data.get("data", [])
                    models = []
                    for m in models_raw:
                        mid = m.get("id", "")
                        name = m.get("name") or mid
                        provider = m.get("owned_by") or "GutsAI"
                        is_claude = mid.startswith("claude-")
                        
                        # Claude models on GutsAI are currently offline/under maintenance upstream
                        if is_claude:
                            status_val = "offline"
                            name_display = f"{name} (Maintenance)"
                        else:
                            status_val = m.get("status", "active")
                            name_display = name

                        models.append({
                            "id": mid,
                            "name": name_display,
                            "provider": provider,
                            "status": status_val,
                        })

                    # Smart sort: Priority active models first, other models middle, offline/claude last
                    def model_sort_key(item: Dict[str, Any]):
                        mid = item["id"]
                        if mid in PRIORITY_MODELS:
                            return (0, PRIORITY_MODELS.index(mid))
                        if item.get("status") == "offline" or mid.startswith("claude-"):
                            return (2, mid)
                        return (1, mid)

                    models.sort(key=model_sort_key)

                    if models:
                        self._cached_models = models
                        self._models_cached_at = current_time
                        return models
                else:
                    logger.warning(f"GutsAI models returned status {response.status_code}: {response.text}")
        except Exception as e:
            logger.warning(f"Could not reach GutsAI /v1/models: {e}. Using fallback catalog.")

        return FALLBACK_MODELS

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        response_format: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Execute a non-streaming chat completion with retry, backoff, and offline fallback."""
        self.validate_configuration()
        selected_model = model or settings.GUTSAI_DEFAULT_MODEL

        payload: Dict[str, Any] = {
            "model": selected_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        if response_format:
            payload["response_format"] = response_format

        url = f"{self.base_url}/chat/completions"
        headers = self._get_headers()

        last_error = None
        for attempt in range(self.max_retries + 2):
            try:
                start_time = time.time()
                async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    latency_ms = (time.time() - start_time) * 1000

                    if response.status_code == 200:
                        data = response.json()
                        usage = data.get("usage", {})
                        choices = data.get("choices", [])
                        content = ""
                        if choices:
                            content = choices[0].get("message", {}).get("content", "")

                        return {
                            "content": content,
                            "model": data.get("model", selected_model),
                            "usage": {
                                "prompt_tokens": usage.get("prompt_tokens", 0),
                                "completion_tokens": usage.get("completion_tokens", 0),
                                "total_tokens": usage.get("total_tokens", 0),
                            },
                            "latency_ms": latency_ms,
                            "raw": data,
                        }

                    # Error handling based on status codes
                    error_data = {}
                    try:
                        error_data = response.json()
                    except Exception:
                        pass
                    err_msg = error_data.get("error", {}).get("message") or response.text
                    err_code = error_data.get("error", {}).get("code", "")

                    # Auto-fallback if the requested model is offline or not found
                    if (
                        response.status_code == 404
                        or err_code in ("model_offline", "model_not_found")
                        or "offline" in str(err_msg).lower()
                        or "not exist" in str(err_msg).lower()
                    ):
                        if selected_model != settings.GUTSAI_DEFAULT_MODEL:
                            logger.warning(
                                f"Model '{selected_model}' offline/tidak tersedia di GutsAI ({err_msg}). "
                                f"Beralih otomatis ke fallback '{settings.GUTSAI_DEFAULT_MODEL}'."
                            )
                            selected_model = settings.GUTSAI_DEFAULT_MODEL
                            payload["model"] = settings.GUTSAI_DEFAULT_MODEL
                            continue

                    if response.status_code == 401:
                        raise GutsAIError("API Key GutsAI tidak valid atau telah kedaluwarsa.", status_code=401)
                    elif response.status_code == 402:
                        raise GutsAIError("Saldo akun GutsAI Anda tidak mencukupi untuk melakukan permintaan ini.", status_code=402)
                    elif response.status_code == 429:
                        if attempt < self.max_retries:
                            time.sleep(1.5 * (attempt + 1))
                            continue
                        raise GutsAIError("Permintaan mencapai batas rate limit. Silakan coba sesaat lagi.", status_code=429)
                    elif response.status_code >= 500:
                        if attempt < self.max_retries:
                            time.sleep(1.0 * (attempt + 1))
                            continue
                        raise GutsAIError(f"Layanan upstream GutsAI mengalami gangguan: {err_msg}", status_code=502)
                    else:
                        raise GutsAIError(f"GutsAI Error ({response.status_code}): {err_msg}", status_code=response.status_code)

            except httpx.TimeoutException:
                if attempt < self.max_retries:
                    time.sleep(1.0)
                    continue
                raise GutsAIError("Permintaan ke AI melebihi batas waktu (timeout).", status_code=504)
            except httpx.RequestError as e:
                last_error = e
                if attempt < self.max_retries:
                    time.sleep(1.0 * (attempt + 1))
                    continue
                raise GutsAIError(f"Gagal terhubung ke GutsAI API: {str(e)}", status_code=503)

        raise GutsAIError(f"Gagal menyelesaikan permintaan setelah beberapa percobaan: {last_error}")

    async def chat_completion_stream(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2500,
    ) -> AsyncGenerator[str, None]:
        """Execute a streaming chat completion yielding SSE text deltas with auto-fallback."""
        self.validate_configuration()
        selected_model = model or settings.GUTSAI_DEFAULT_MODEL

        payload = {
            "model": selected_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }

        url = f"{self.base_url}/chat/completions"
        headers = self._get_headers()

        async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
            async with client.stream("POST", url, json=payload, headers=headers) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    try:
                        err_json = json.loads(error_text)
                        err_msg = err_json.get("error", {}).get("message", error_text.decode("utf-8"))
                        err_code = err_json.get("error", {}).get("code", "")
                    except Exception:
                        err_msg = error_text.decode("utf-8")
                        err_code = ""

                    # Auto fallback to default model if requested model is offline
                    if (
                        response.status_code == 404
                        or err_code in ("model_offline", "model_not_found")
                        or "offline" in str(err_msg).lower()
                    ) and selected_model != settings.GUTSAI_DEFAULT_MODEL:
                        logger.warning(
                            f"Streaming model '{selected_model}' offline. Beralih ke fallback '{settings.GUTSAI_DEFAULT_MODEL}'."
                        )
                        payload["model"] = settings.GUTSAI_DEFAULT_MODEL
                        async with client.stream("POST", url, json=payload, headers=headers) as fallback_resp:
                            if fallback_resp.status_code == 200:
                                async for line in fallback_resp.aiter_lines():
                                    if not line:
                                        continue
                                    line = line.strip()
                                    if line.startswith("data: "):
                                        data_str = line[6:]
                                        if data_str == "[DONE]":
                                            break
                                        try:
                                            chunk = json.loads(data_str)
                                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                                            content = delta.get("content")
                                            if content:
                                                yield content
                                        except Exception:
                                            continue
                                return

                    if response.status_code == 401:
                        yield f"[ERROR] GutsAI API key tidak valid. Silakan periksa GUTS_API_KEY."
                    elif response.status_code == 402:
                        yield f"[ERROR] Saldo GutsAI tidak mencukupi untuk request ini."
                    elif response.status_code == 429:
                        yield f"[ERROR] Terkena rate limit. Mohon tunggu beberapa detik."
                    else:
                        yield f"[ERROR] AI Gateway ({response.status_code}): {err_msg}"
                    return

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    line = line.strip()
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content")
                            if content:
                                yield content
                        except Exception:
                            continue


# Global singleton instance
guts_client = GutsAIClient()
