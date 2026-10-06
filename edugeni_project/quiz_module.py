"""Generate and validate three-question multiple-choice quizzes."""

from typing import Any

from gemini_client import generate_json


def generate_quiz(text: str) -> dict[str, list[dict[str, Any]]]:
    prompt = f"""Create exactly 3 clear multiple-choice questions based only on this topic or
study material. Return JSON with this shape and no extra fields:
{{"questions":[{{"question":"...","options":["...","...","...","..."],
"answer":"exactly one option","explanation":"short explanation"}}]}}
There must be exactly four distinct options per question, and answer must exactly match
one of those options. Content:
{text}"""
    response = generate_json(prompt)
    questions = response.get("questions")
    if not isinstance(questions, list) or len(questions) != 3:
        raise ValueError("The quiz could not be formatted correctly. Please generate it again.")

    cleaned_questions = []
    for question in questions:
        if not isinstance(question, dict):
            raise ValueError("The quiz could not be formatted correctly. Please generate it again.")
        title = question.get("question")
        options = question.get("options")
        answer = question.get("answer")
        explanation = question.get("explanation")
        if (
            not isinstance(title, str)
            or not title.strip()
            or not isinstance(options, list)
            or len(options) != 4
            or any(not isinstance(option, str) or not option.strip() for option in options)
            or len({option.strip() for option in options}) != 4
            or not isinstance(answer, str)
            or answer.strip() not in {option.strip() for option in options}
            or not isinstance(explanation, str)
            or not explanation.strip()
        ):
            raise ValueError("The quiz could not be formatted correctly. Please generate it again.")
        cleaned_questions.append(
            {
                "question": title.strip(),
                "options": [option.strip() for option in options],
                "answer": answer.strip(),
                "explanation": explanation.strip(),
            }
        )
    return {"questions": cleaned_questions}