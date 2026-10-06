"""Academic question-and-answer feature."""

from gemini_client import generate_text


def answer_question(question: str) -> str:
    prompt = f"""Answer this student's academic question directly: {question!r}
Explain the answer in simple language, add an example if useful, and finish with the
most important takeaway. Be accurate and acknowledge uncertainty when needed."""
    return generate_text(prompt)