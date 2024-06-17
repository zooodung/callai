import os
from fastapi import FastAPI, Request, UploadFile, File, Query
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import logging
import requests
from elevenlabs.client import ElevenLabs
from elevenlabs import play
import tempfile
import requests
import json
from elevenlabs import Voice, VoiceSettings, play
from elevenlabs.client import ElevenLabs

from openai_api import openai_user_sentence, openai_training_sentence, openai_training_first_sentence, openai_stt, openai_get_summary, openai_get_comment
from elevenlab_api import clone_user_voice, get_voice_id
from nlp_7class import extract_percentage, predict_emotion

app = FastAPI()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# CORS 설정
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:8088",
    "http://127.0.0.1:8088"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "html"))

#logger.info(f"BASE_DIR: {BASE_DIR}")
#logger.info(f"TEMPLATE_DIR: {os.path.join(BASE_DIR, 'html')}")
#logger.info(f"STATIC_DIR: {os.path.join(BASE_DIR, 'html', 'static')}")

#index 페이지 설정
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    logger.info("Root endpoint called")
    try:
        return templates.TemplateResponse("index.html", {"request": request})
    except Exception as e:
        logger.error(f"Error rendering template: {e}")
        return HTMLResponse(content="Template not found", status_code=404)

# 롤플레잉 특정 인물의 인삿말  
@app.post("/training_first_sentence")
async def training_sentence(request: Request):
    data = await request.json()
    character = data.get("character")
    attitude = data.get("attitude")

    #logger.info(f"Training sentence requested for character: {character}, attitude: {attitude}")  # 로그 추가

    try:
        sentence = openai_training_first_sentence(character, attitude)
        return {"sentence": sentence}
    except Exception as e:
        logger.error(f"Error generating training sentence: {e}")
        return {"error": "Failed to generate training sentence"}, 500

# STT 
@app.post("/stt")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    try:
        contents = await audio_file.read()

        temp_file_path = "temp_audio.wav"
        with open(temp_file_path, "wb") as temp_file:
            temp_file.write(contents)

        transcript = openai_stt(temp_file_path)
        os.remove(temp_file_path)  
        
        logger.info(f"Transcript: {transcript}") 

        return {"transcript": transcript}
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        return {"error": "Failed to transcribe audio"}, 500

# Elevenlabs 사용자 목소리 학습
voice = ''
@app.post("/clone_user_voice")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    try:
        contents = await audio_file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(contents)
            temp_file_path = temp_file.name

            global voice
            voice = clone_user_voice(temp_file_path)

    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        return {"error": "Failed to transcribe audio"}, 500

# GPT 4-o 특정 인물 답변 문장 생성
@app.post("/training_sentence")
async def generate_response(request: Request):
    data = await request.json()
    character = data.get("character")
    attitude = data.get("attitude")
    input_text = data.get("input_text")
    history = data.get("history")

    #logger.info(f"Generating response for character: {character}, attitude: {attitude}, input: {input_text}")

    try:
        response_sentence = openai_training_sentence(character, attitude, input_text, history)
        return {"sentence": response_sentence}
    except Exception as e:
        logger.error(f"Error generating response sentence: {e}")
        return {"error": "Failed to generate response sentence"}, 500

# 연습 결과, 전화 결과
@app.post("/training_result")
async def get_summary(request: Request):
    data = await request.json()
    character = data.get("character")
    history = data.get("history")
    #logger.info(f"{history}")

    all_messages = history['user_history'] + history['ai_history']
    combined_message = ' '.join(all_messages)
    #logger.info(f"{combined_message}")

    try:
        response_sentence = openai_get_summary(character, history)
        comment_sentence = openai_get_comment(character, history)
        predicted_emotion = predict_emotion(combined_message)
        max_emotion = max(predicted_emotion, key=lambda x: extract_percentage(predicted_emotion[x]))
        return {"sentence": response_sentence, "comment": comment_sentence, "emotion": max_emotion}
    except Exception as e:
        logger.error(f"Error get_summary: {e}")
        return {"error": "Failed to get_summary"}, 500

# 사용자 핵심 문장/단어 재구성
@app.post("/user_sentence")
async def training_sentence(request: Request):
    data = await request.json()
    keyword = data.get("keywords")
    sentenceType = data.get("type")
    attitude = data.get("attitude")

    try:
        sentence = openai_user_sentence(keyword, sentenceType, attitude)
        return {"sentence": sentence}
    except Exception as e:
        logger.error(f"Error generating user sentence: {e}")
        return {"error": "Failed to generate user sentence"}, 500

# 사용자 학습 TTS
@app.get("/get_voice_id")
def get_voice_id_elevenlab(text: str = Query(..., description="변환할 텍스트")):
    voice_id = get_voice_id() 
    client = ElevenLabs(
        api_key="API_KEY",
    )

    audio = client.generate(
        text=text,  
        voice=Voice(
            voice_id=voice_id,
            settings=VoiceSettings(stability=0.4, similarity_boost=0.8, style=0.0, use_speaker_boost=True)
        ),
        model="eleven_multilingual_v2",
        stream=True 
    )

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as f:
        for chunk in audio: 
            f.write(chunk)
        audio_file_path = f.name

    return FileResponse(audio_file_path, media_type="audio/mpeg", filename="generated_audio.mp3")


app.mount("/", StaticFiles(directory="html", html=True), name="static")
app.mount("/assets", StaticFiles(directory=os.path.join(BASE_DIR, "html\\assets")), name="assets")