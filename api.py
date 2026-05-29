from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import List, Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ocr_utils import extract_text_from_image
from rag_chain import answer_question, extract_application_checklist


app = FastAPI(
    title="NomadScholar AI API",
    description="FastAPI backend for a bilingual multimodal RAG assistant.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatTurn(BaseModel):
    user: str
    assistant: str


class ChatRequest(BaseModel):
    question: str
    history: Optional[List[ChatTurn]] = []


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]


class ChecklistRequest(BaseModel):
    text: str


@app.get("/")
def root():
    return {
        "name": "NomadScholar AI API",
        "status": "running",
        "docs": "/docs",
    }


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    history = [(turn.user, turn.assistant) for turn in request.history or []]

    result = answer_question(
        question=request.question,
        history=history,
        image_text="",
    )

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
    )


@app.post("/api/chat-with-image", response_model=ChatResponse)
async def chat_with_image(
    question: str = Form(""),
    image: UploadFile = File(...),
):
    allowed_extensions = {".png", ".jpg", ".jpeg"}

    file_extension = Path(image.filename).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PNG, JPG, and JPEG images are supported.",
        )

    try:
        file_bytes = await image.read()

        with NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name

        image_text = extract_text_from_image(temp_path)

        final_question = question.strip()

        if not final_question:
            final_question = (
                "Please explain this uploaded image. Extract important requirements, "
                "deadlines, eligibility notes, required documents, and next steps."
            )

        result = answer_question(
            question=final_question,
            history=[],
            image_text=image_text,
        )

        answer = result["answer"]

        if image_text:
            answer += "\n\n---\n\n### Text extracted from image\n"
            answer += image_text[:2000]

        return ChatResponse(
            answer=answer,
            sources=result["sources"],
        )

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.post("/api/checklist")
def checklist(request: ChecklistRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    result = extract_application_checklist(request.text)

    return result.model_dump()