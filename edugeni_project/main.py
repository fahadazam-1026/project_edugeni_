"""FastAPI application for the EduGenie learning assistant."""

import logging
from pathlib import Path
from typing import Any, Callable

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field, field_validator
from starlette.concurrency import run_in_threadpool

from explanation_module import explain_concept
from gemini_client import GeminiConfigurationError, GeminiServiceError
from learning_path import create_learning_path
from qna import answer_question
from quiz_module import generate_quiz
from summary_module import summarize_text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
app = FastAPI(title="EduGenie", description="Your AI-Powered Learning Companion")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")


def non_empty(value: str) -> str:
    """Trim user input and reject whitespace-only values."""
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Please enter some text before generating a response.")
    return cleaned


class TopicRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=4000)

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, value: str) -> str:
        return non_empty(value)


class QuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        return non_empty(value)


class TextRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        return non_empty(value)


async def run_feature(operation: Callable[..., Any], value: str) -> Any:
    """Run a feature and translate service failures into safe API messages."""
    try:
        return await run_in_threadpool(operation, value)
    except GeminiConfigurationError as error:
        raise HTTPException(
            status_code=503,
            detail="EduGenie is not connected yet. Add your Gemini API key to the .env file and restart the app.",
        ) from error
    except GeminiServiceError as error:
        logger.warning("Gemini request failed: %s", error)
        raise HTTPException(
            status_code=502,
            detail="Gemini could not complete that request. Please try again in a moment.",
        ) from error
    except ValueError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, error: Exception) -> JSONResponse:
    """Keep unexpected server details in the logs, not in the browser."""
    logger.exception("Unexpected error while handling %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on our side. Please try again."},
    )


@app.get("/")
async def home(request: Request):
    """Render the learning dashboard."""
    return templates.TemplateResponse(request=request, name="index.html")


@app.post("/explain")
async def explain(request: TopicRequest):
    return {"result": await run_feature(explain_concept, request.topic)}


@app.post("/qa")
async def qa(request: QuestionRequest):
    return {"result": await run_feature(answer_question, request.question)}


@app.post("/quiz")
async def quiz(request: TextRequest):
    return await run_feature(generate_quiz, request.text)


@app.post("/summarize")
async def summarize(request: TextRequest):
    return {"result": await run_feature(summarize_text, request.text)}


@app.post("/learn/recommendations")
async def learning_recommendations(request: TopicRequest):
    return await run_feature(create_learning_path, request.topic)