"""Beginner-friendly concept explanations."""

from gemini_client import generate_text


def explain_concept(topic: str) -> str:
    prompt = f"""Explain {topic!r} to a school or college student who is new to it.
Use this structure: a simple definition, an easy explanation in short paragraphs,
important points, a real-world example, and a short conclusion. Keep technical terms
simple and explain any that are necessary. Be accurate and focused on understanding."""
    return generate_text(prompt)