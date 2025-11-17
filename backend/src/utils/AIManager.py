import vosk
import json


class AIManager:

    def __init__(self, model_path: str, sample_rate: int):
        self.sample_rate = sample_rate

        vosk.SetLogLevel(-1)  # Reduce log verbosity
        try:
            vosk.GpuInit()
            print("GPU acceleration enabled for Vosk!")
            self.gpu_enabled = True
        except:
            print("GPU not available, using CPU")
            self.gpu_enabled = False

        try:
            print("Loading Vosk model...")
            self.vosk_model = vosk.Model(model_path)
            print(f"Model loaded! (GPU: {self.get_gpu_status()})")
        except Exception as e:
            raise RuntimeError(f"Failed to load Vosk model: {e}")

    def get_gpu_status(self) -> str:
        return "enabled" if self.gpu_enabled else "disabled"

    def create_recognizer(self):
        recognizer = vosk.KaldiRecognizer(self.vosk_model, self.sample_rate)
        recognizer.SetWords(True)
        return recognizer

    def processing_audio(self, recognizer, audio_data: bytes):
        if recognizer.AcceptWaveform(audio_data):
            result = json.loads(recognizer.Result())
            return result.get("text", "").strip(), None
        else:
            partial = json.loads(recognizer.PartialResult())
            return None, partial.get("partial", "").strip()
