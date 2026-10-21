"""
watsonx_client.py
-----------------
Thin wrapper around the ibm-watsonx-ai SDK.
Reads credentials from environment / .env file.

Model used: ibm/granite-13b-instruct-v2

Required env vars (copy src/.env.example → src/.env and fill in):
  WATSONX_APIKEY      — IBM Cloud API key
  WATSONX_PROJECT_ID  — watsonx.ai project ID
  WATSONX_URL         — regional endpoint (default: https://us-south.ml.cloud.ibm.com)
"""

import os
from dotenv import load_dotenv
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

load_dotenv()

# ── defaults ──────────────────────────────────────────────────────────────────
DEFAULT_MODEL = "ibm/granite-13b-instruct-v2"
DEFAULT_PARAMS = {
    GenParams.MAX_NEW_TOKENS: 800,
    GenParams.TEMPERATURE: 0.3,
    GenParams.STOP_SEQUENCES: [],
}


def call_model(
    prompt: str,
    model_id: str = DEFAULT_MODEL,
    params: dict | None = None,
) -> str:
    """
    Send a prompt to watsonx.ai and return the generated text.

    Args:
        prompt:   The full prompt string.
        model_id: watsonx.ai model ID (default: granite-13b-instruct-v2).
        params:   Optional generation parameters (merged with defaults).

    Returns:
        The generated text as a string.
    """
    api_key = os.environ.get("WATSONX_APIKEY")
    project_id = os.environ.get("WATSONX_PROJECT_ID")
    url = os.environ.get("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

    if not api_key:
        raise EnvironmentError(
            "WATSONX_APIKEY is not set. "
            "Add it to .env or export it in your shell."
        )
    if not project_id:
        raise EnvironmentError(
            "WATSONX_PROJECT_ID is not set. "
            "Add it to .env or export it in your shell."
        )

    merged_params = {**DEFAULT_PARAMS, **(params or {})}
    model = ModelInference(
        model_id=model_id,
        credentials=Credentials(url=url, api_key=api_key),
        project_id=project_id,
        params=merged_params,
    )
    return model.generate_text(prompt=prompt)


if __name__ == "__main__":
    import sys

    print("Connecting to watsonx.ai...")
    try:
        response = call_model("In one sentence, what is IBM watsonx.ai?")
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
