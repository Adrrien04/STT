import vosk
import sounddevice as sd
import json
import queue

# --- Paramètres ---
# Mettez ici le nom du dossier du modèle que vous avez décompressé
MODEL_PATH = "vosk-model-small-fr-0.22" 
SAMPLERATE = 16000
DEVICE = None # Laissez None pour le micro par défaut

# --- Initialisation ---
try:
    model = vosk.Model(MODEL_PATH)
except Exception as e:
    print(f"Erreur lors du chargement du modèle depuis '{MODEL_PATH}'.")
    print("Assurez-vous d'avoir téléchargé et décompressé le modèle au bon endroit.")
    print(f"Détail de l'erreur : {e}")
    exit(1)

q = queue.Queue()

def callback(indata, frames, time, status):
    """Fonction appelée par sounddevice pour chaque bloc audio."""
    if status:
        print(status)
    q.put(bytes(indata))

# --- Script principal ---
try:
    print("✅ Modèle Vosk chargé.")
    print("🎙️  L'écoute est active. Parlez dans votre micro.")
    print("    (Appuyez sur Ctrl+C pour arrêter)")

    # Création du flux audio
    with sd.RawInputStream(samplerate=SAMPLERATE, blocksize=8000, device=DEVICE,
                           dtype='int16', channels=1, callback=callback):
        
        recognizer = vosk.KaldiRecognizer(model, SAMPLERATE)
        
        while True:
            data = q.get()
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                if result['text']:
                    print("-> " + result['text'])

except KeyboardInterrupt:
    print("\n🛑 Arrêt du programme.")
except Exception as e:
    print(f"Une erreur est survenue : {e}")