import base64
import os
import time
import wave
import io
import audioop
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from src.utils.ConnectionManager import ConnectionManager
from src.utils.AIManager import AIManager

load_dotenv()

ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "http://localhost:3000")
TARGET_SAMPLERATE = int(os.getenv("SAMPLERATE", 16000))

app = FastAPI()

# Ajout du middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()

# Initialisation de l'AI Manager
# Note : "../vosk-model-fr-0.22" doit être le chemin correct vers ton modèle
ai_manager = AIManager("../vosk-model-fr-0.22", TARGET_SAMPLERATE)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    session_id = int(time.time())
    chunk_counter = 0

    # Création d'un recognizer pour cette session
    recognizer = ai_manager.create_recognizer()

    # Variable pour garder l'état du resampling entre les chunks
    # C'est crucial pour éviter les coupures audio
    resample_state = None

    try:
        gpu_status = ai_manager.get_gpu_status()
        print(f"Client connected via WebSocket. Session: {session_id}")
        await websocket.send_text(f"Connected to speech-to-text service (Vosk on {gpu_status})")

        while True:
            data = await websocket.receive_text()

            if data.startswith("data:audio/wav;base64,"):
                b64_data = data.split(",")[1]
                decoded_audio = base64.b64decode(b64_data)
                try:
                    with wave.open(io.BytesIO(decoded_audio), "rb") as wf:
                        incoming_rate = wf.getframerate()
                        n_channels = wf.getnchannels()

                        audio_data = wf.readframes(wf.getnframes())

                    if n_channels > 1:
                        audio_data = audioop.tomono(audio_data, 2, 1, 1)
                    if incoming_rate != TARGET_SAMPLERATE:
                        audio_data, resample_state = audioop.ratecv(
                            audio_data,       # Données brutes
                            2,                # Sample width (2 bytes = 16 bits)
                            1,                # Channels (1 car converti en mono)
                            incoming_rate,    # Taux d'entrée (ex: 48000)
                            TARGET_SAMPLERATE,# Taux de sortie (16000)
                            resample_state    # État précédent
                        )

                    transcribed_text, partial_text = ai_manager.processing_audio(
                        recognizer, audio_data
                    )

                    if transcribed_text:
                        print(f"Final: {transcribed_text}")
                        await websocket.send_text(f'{{"type":"final","text":"{transcribed_text}"}}')
                    elif partial_text:
                        await websocket.send_text(f'{{"type":"partial","text":"{partial_text}"}}')

                    chunk_counter += 1

                except wave.Error as e:
                    print(f"Erreur format WAV : {e}")
                except Exception as e:
                    print(f"Erreur traitement audio : {e}")
                    await websocket.send_text(f'{{"type":"error","text":"{str(e)}"}}')

            else:
                pass

    except WebSocketDisconnect:
        print(f"Client disconnected. Session {session_id} ended.")
        manager.disconnect(websocket)

    except Exception as e:
        print(f"Critical Error: {e}")
        manager.disconnect(websocket)
