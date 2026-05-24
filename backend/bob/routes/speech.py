"""Speech-to-text fallback route for browsers without SpeechRecognition."""

from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..schemas import SpeechTranscriptionOut
from ..speech import SpeechUnavailable, transcribe_bytes

router = APIRouter(tags=["speech"])


@router.post("/speech/transcribe", response_model=SpeechTranscriptionOut)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form("sv"),
):
    try:
        data = await file.read()
        suffix = "." + file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ".webm"
        text = transcribe_bytes(data, suffix=suffix, language=language)
        if not text:
            raise HTTPException(422, "No speech detected. Try again.")
        return SpeechTranscriptionOut(text=text)
    except SpeechUnavailable as e:
        raise HTTPException(503, str(e))
