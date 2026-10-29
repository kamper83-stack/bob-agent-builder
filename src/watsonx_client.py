"""
gemini_client.py (kept as watsonx_client.py for import compatibility)
----------------------------------------------------------------------
Thin wrapper around the Google Gen AI SDK (Gemini).
Reads credentials from environment / .env file.

Required env vars (copy src/.env.example → src/.env and fill in):
  GEMINI_API_KEY  — Google AI Studio API key
  GEMINI_MODEL    — model alias (default: gemini-flash-latest)
"""

import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# ── defaults ──────────────────────────────────────────────────────────────────
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
DEFAULT_TEMPERATURE = 0.3
DEFAULT_MAX_TOKENS = 2048


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GEMINI_API_KEY is not set. "
            "Add it to src/.env or export it in your shell."
        )
    return genai.Client(api_key=api_key)


def call_model(
    prompt: str,
    model_id: str | None = None,
    params: dict | None = None,
    system_instruction: str | None = None,
    response_schema: type | None = None,
) -> str:
    """
    Send a prompt to Gemini and return the generated text.

    Args:
        prompt:              The user prompt string.
        model_id:            Gemini model alias (default: GEMINI_MODEL env var).
        params:              Optional overrides: temperature (float),
                             max_output_tokens (int).
        system_instruction:  Optional system prompt, passed as a first-class
                             GenerateContentConfig field.
        response_schema:     Optional Pydantic model. When provided the response
                             is returned as JSON matching that schema.

    Returns:
        The generated text (or JSON string when response_schema is set).
    """
    client = _get_client()
    p = params or {}

    config_kwargs: dict = dict(
        temperature=p.get("temperature", DEFAULT_TEMPERATURE),
        max_output_tokens=p.get("max_output_tokens", DEFAULT_MAX_TOKENS),
    )
    if system_instruction:
        config_kwargs["system_instruction"] = system_instruction
    if response_schema is not None:
        config_kwargs["response_mime_type"] = "application/json"
        config_kwargs["response_schema"] = response_schema

    response = client.models.generate_content(
        model=model_id or DEFAULT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(**config_kwargs),
    )
    return response.text


if __name__ == "__main__":
    import sys

    print("Connecting to Gemini...")
    try:
        response = call_model("In one sentence, what is Google Gemini?")
        print("\n✓ Response received:")
        print("-" * 60)
        print(response)
        print("-" * 60)
        print("\nSmoke test PASSED.")
        sys.exit(0)
    except EnvironmentError as e:
        print(f"\n✗ Configuration error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ API error: {e}")
        sys.exit(1)
