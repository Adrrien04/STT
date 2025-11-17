import base64
import os
import time
import wave
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from src.utils.ConnectionManager import ConnectionManager
from src.utils.AIManager import AIManager
from dotenv import load_dotenv

load_dotenv()
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "http://localhost:3000")
SAMPLERATE = int(os.getenv("SAMPLERATE", 48000))

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()

# Create audio chunks directory if it doesn't exist
os.makedirs("audio_chunks", exist_ok=True)

# Initialize AI Manager
ai_manager = AIManager("../vosk-model-small-fr-0.22", SAMPLERATE)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()  # Accept immediately
    chunk_counter = 0
    session_id = int(time.time())  # Unique session ID

    # Create a recognizer for this session
    recognizer = ai_manager.create_recognizer()

    try:
        gpu_status = ai_manager.get_gpu_status()
        await websocket.send_text(f"Connected to speech-to-text service (Vosk on {gpu_status})")

        while True:
            data = await websocket.receive_text()

            if data.startswith("data:audio/wav;base64,"):
                print(f"Received audio chunk {chunk_counter}")

                audio_data = data.split(",")[1]
                decoded_audio = base64.b64decode(audio_data)

                chunk_filename = (
                    f"audio_chunks/session_{session_id}_chunk_{chunk_counter:04d}.wav"
                )
                with open(chunk_filename, "wb") as f:
                    f.write(decoded_audio)

                try:
                    with wave.open(chunk_filename, "rb") as wf:
                        # Check if audio format is compatible
                        if wf.getframerate() != SAMPLERATE:
                            print(
                                f"Warning: Audio sample rate {wf.getframerate()} != {SAMPLERATE}"
                            )

                        audio_data = wf.readframes(wf.getnframes())

                    transcribed_text, partial_text = ai_manager.processing_audio(
                        recognizer, audio_data
                    )

                    if transcribed_text:
                        await websocket.send_text(f'{{"type":"final","text":"{transcribed_text}"}}')
                    elif partial_text:
                        await websocket.send_text(f'{{"type":"partial","text":"{partial_text}"}}')

                except Exception as e:
                    print(f"Error processing audio file: {e}")
                    await websocket.send_text(f'{{"type":"error","text":"{str(e)}"}}')

                chunk_counter += 1

            else:
                await websocket.send_text(f"Received: {data}")

    except WebSocketDisconnect:
        print(
            f"Client disconnected. Session {session_id} ended with {chunk_counter} chunks."
        )
        recognizer.Reset()
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Error: {e}")
        manager.disconnect(websocket)
        await manager.broadcast(f"Client left: {e}")
