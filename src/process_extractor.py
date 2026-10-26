"""
process_extractor.py
--------------------
Given the agent's input description, output description, and grounding policy,
asks the model to produce a short ordered list of plain-language steps that
describes what the agent will do — one sentence per step, in the user's language.

The steps are meant to be shown to the user for review before the agent runs.

Usage:
    from src.process_extractor import extract_process
    steps = extract_process(input_type, output_type, policy_text)
    # steps = ["Extract the customer name from the complaint",
    #          "Look them up in the contacts list", ...]
"""

import json
from pydantic import BaseModel

from src.watsonx_client import call_model


# ── Response schema ───────────────────────────────────────────────────────────

class ProcessSteps(BaseModel):
    steps: list[str]


# ── Prompts ───────────────────────────────────────────────────────────────────

_SYSTEM_INSTRUCTION = (
    "You are an AI assistant that explains, in plain language, "
    "what an AI agent will do step by step. "
    "Each step is one short sentence. "
    "Use the same language as the user's input description. "
    "Be concrete and specific — not generic. "
    "Return between 3 and 6 steps."
)

_PROMPT_TEMPLATE = """\
An agent will receive: {input_type}
It will produce: {output_type}
It will follow this company policy:
---
{policy_text}
---{example_block}
List the steps the agent will take, in the order it will take them."""


# ── Public API ────────────────────────────────────────────────────────────────

def extract_process(
    input_type: str,
    output_type: str,
    policy_text: str,
    example_input: str | None = None,
    example_output: str | None = None,
) -> list[str]:
    """
    Return an ordered list of plain-language steps describing what the agent
    will do. Between 3 and 6 steps, each one sentence.

    Args:
        input_type:     What the user will give the agent (from Define screen).
        output_type:    What the agent should produce (from Define screen).
        policy_text:    The company policy document text (grounding context).
        example_input:  Optional real example input (from user's Examples section).
        example_output: Optional ideal output for the example (from user's Examples section).

    Returns:
        A list of strings, each a single-sentence step description.

    Raises:
        ValueError: if the model response cannot be parsed.
    """
    example_block = ""
    if example_input and example_output:
        example_block = (
            f"\n\nHere is a real example of what the agent will handle:\n"
            f"Example input: {example_input.strip()}\n"
            f"Ideal output: {example_output.strip()}\n"
            f"Use this example to make the steps concrete and specific."
        )

    prompt = _PROMPT_TEMPLATE.format(
        input_type=input_type,
        output_type=output_type,
        policy_text=policy_text,
        example_block=example_block,
    )
    raw = call_model(
        prompt,
        system_instruction=_SYSTEM_INSTRUCTION,
        response_schema=ProcessSteps,
    )
    return json.loads(raw)["steps"]
