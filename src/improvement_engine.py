"""
improvement_engine.py
---------------------
The feature that makes Agent Studio different from every other agent builder.

Takes the agent's current instructions, a star rating (1-5) and a user comment
— and proposes one specific, concrete edit to the instructions that would make
the next run better.

Usage:
    from src.improvement_engine import suggest_improvement

    suggestion = suggest_improvement(
        current_instructions="You are a customer service assistant...",
        rating=3,
        comment="Too formal — more human, use their name",
    )
    # "Add instruction: address the customer by their first name; open with
    #  a brief empathetic acknowledgement before moving to the resolution."
"""

from src.watsonx_client import call_model

_PROMPT_TEMPLATE = """You are an AI coach that helps improve agent instructions.

A user ran an AI agent and rated its output {rating} out of 5 stars.
They left this comment: "{comment}"

The agent's current instructions are:
---
{current_instructions}
---

Your task: propose ONE specific, concrete change to the instructions that would
directly address the user's feedback. The suggestion must be:
- A real instruction edit (not just a restatement of the comment)
- 1 to 3 sentences maximum
- Written as an addition or modification to the existing instructions
- Actionable — something the agent can follow immediately

Respond with the suggested instruction change only. No preamble, no explanation."""


def suggest_improvement(
    current_instructions: str,
    rating: int,
    comment: str,
) -> str:
    """
    Propose a concrete edit to the agent instructions based on user feedback.

    Args:
        current_instructions: The agent's current instruction text.
        rating:               Star rating given by the user (1–5).
        comment:              Free-text feedback from the user.

    Returns:
        A suggested instruction change as a plain string.
    """
    prompt = _PROMPT_TEMPLATE.format(
        rating=rating,
        comment=comment,
        current_instructions=current_instructions.strip(),
    )
    return call_model(prompt).strip()
