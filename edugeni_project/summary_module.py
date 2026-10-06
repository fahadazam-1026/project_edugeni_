"""Concise study-material summaries."""

from gemini_client import generate_text


def summarize_text(text: str) -> str:
    prompt = f"""Turn this study material into a concise revision guide. Include a short
summary, easy-to-scan key points, and a short glossary of important terms with simple
definitions. Keep essential facts and use clear student-friendly language.

Study material:
{text}"""
    return generate_text(prompt)