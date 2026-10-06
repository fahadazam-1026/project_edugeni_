"""Create a structured learning path from beginner to advanced."""

from typing import Any

from gemini_client import generate_json

LEVELS = ["Beginner", "Intermediate", "Advanced"]


def create_learning_path(topic: str) -> dict[str, list[dict[str, Any]]]:
    prompt = f"""Build a practical learning path for {topic!r}. Return only JSON in this shape:
{{"levels":[{{"level":"Beginner","description":"...","topics":["..."],
"resources":["..."]}},{{"level":"Intermediate","description":"...",
"topics":["..."],"resources":["..."]}},{{"level":"Advanced",
"description":"...","topics":["..."],"resources":["..."]}}]}}
Include the levels in this order: Beginner, Intermediate, Advanced. Order topics from
foundational to more challenging within each level. Suggest useful books, documentation,
or reputable learning resources when possible."""
    response = generate_json(prompt)
    levels = response.get("levels")
    if not isinstance(levels, list) or len(levels) != len(LEVELS):
        raise ValueError("The learning path could not be formatted correctly. Please try again.")

    cleaned_levels = []
    for expected_level, level_data in zip(LEVELS, levels):
        if not isinstance(level_data, dict):
            raise ValueError("The learning path could not be formatted correctly. Please try again.")
        description = level_data.get("description")
        topics = level_data.get("topics")
        resources = level_data.get("resources", [])
        if (
            level_data.get("level") != expected_level
            or not isinstance(description, str)
            or not description.strip()
            or not isinstance(topics, list)
            or not topics
            or any(not isinstance(item, str) or not item.strip() for item in topics)
            or not isinstance(resources, list)
            or any(not isinstance(item, str) or not item.strip() for item in resources)
        ):
            raise ValueError("The learning path could not be formatted correctly. Please try again.")
        cleaned_levels.append(
            {
                "level": expected_level,
                "description": description.strip(),
                "topics": [item.strip() for item in topics],
                "resources": [item.strip() for item in resources],
            }
        )
    return {"levels": cleaned_levels}