"""Small shared wrapper around the Google Gen AI SDK."""

import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from google import genai

load_dotenv()

DEFAULT_MODEL = "gemini-2.5-flash"


class GeminiConfigurationError(Exception):
    """Raised when the Gemini API key has not been configured."""


class GeminiServiceError(Exception):
    """Raised when Gemini cannot return a usable response."""


def generate_text(prompt: str, *, expect_json: bool = False) -> str:
    """Send a prompt to Gemini and return its response text."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "YOUR_API_KEY_HERE":
        raise GeminiConfigurationError("GEMINI_API_KEY is not configured.")

    try:
        client = genai.Client(api_key=api_key)
        config: dict[str, Any] = {"response_mime_type": "application/json"} if expect_json else {}
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", DEFAULT_MODEL),
            contents=prompt,
            config=config or None,
        )
        text = response.text
        if not text:
            raise GeminiServiceError("Gemini returned an empty response.")
        return text.strip()
    except GeminiServiceError:
        raise
    except Exception as error:
        raise GeminiServiceError("The Gemini service request failed.") from error


def generate_json(prompt: str) -> dict[str, Any]:
    """Request JSON and safely decode the model response."""
    response_text = generate_text(prompt, expect_json=True)
    response_text = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        response_text,
        flags=re.IGNORECASE,
    ).strip()
    try:
        result = json.loads(response_text)
    except json.JSONDecodeError as error:
        raise ValueError("Gemini returned an unreadable response. Please try again.") from error
    if not isinstance(result, dict):
        raise ValueError("Gemini returned an unexpected response. Please try again.")
    return result