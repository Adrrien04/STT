import { useState, useEffect, useRef } from "react";
import { Card, Alert, Spinner, Button } from "react-bootstrap";
import RecordRTC, { StereoAudioRecorder } from "recordrtc";

// --- Types ---
type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface VoskMessage {
    text: string;
    type: "partial" | "final" | "error";
}

// --- URL du backend ---
const WEBSOCKET_URL = "ws://localhost:8000/ws";

function TranscriptionDisplay() {
    // --- STATES ---
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
    const [finalTranscript, setFinalTranscript] = useState<string>("");
    const [partialTranscript, setPartialTranscript] = useState<string>("");
    const [isRecording, setIsRecording] = useState<boolean>(false);

    // --- REFS ---
    const wsRef = useRef<WebSocket | null>(null);
    const recorder = useRef<RecordRTC | null>(null);
    const mediaStream = useRef<MediaStream | null>(null);

    // --- CONNEXION WS ---
    const connectWebSocket = () => {
        if (wsRef.current) wsRef.current.close();

        setConnectionStatus("connecting");
        const ws = new WebSocket(WEBSOCKET_URL);
        wsRef.current = ws;

        ws.onopen = () => setConnectionStatus("connected");

        ws.onmessage = (event) => {
            const msg = event.data;

            // Ignorer les messages de connexion simples
            if (msg.startsWith("Connected")) return;

            try {
                // On essaie de parser le JSON venant du backend Python
                const data: VoskMessage = JSON.parse(msg);

                if (data.type === "final") {
                    // IMPORTANT : On ajoute au texte existant (prev) au lieu de remplacer
                    setFinalTranscript(prev => prev + " " + data.text);
                    setPartialTranscript(""); // On vide le partiel car il est devenu final
                } else if (data.type === "partial") {
                    setPartialTranscript(data.text);
                }
            } catch (e) {
                // Gestion fallback pour les anciens formats texte (si besoin)
                console.warn("Format non JSON reçu ou erreur:", msg);
            }
        };

        ws.onerror = () => setConnectionStatus("disconnected");

        ws.onclose = () => {
            setConnectionStatus("disconnected");
            // Reconnexion automatique après 3s
            setTimeout(() => {
                if (wsRef.current?.readyState === WebSocket.CLOSED) {
                    connectWebSocket();
                }
            }, 3000);
        };
    };

    // --- START RECORDING ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStream.current = stream;

            // CORRECTION ICI : On NE vide PAS finalTranscript
            setPartialTranscript("");

            const recorderInstance = new RecordRTC(stream, {
                type: "audio",
                mimeType: "audio/wav",
                recorderType: StereoAudioRecorder,
                sampleRate: 48000, // On peut laisser 48k, le backend convertira
                numberOfAudioChannels: 1,
                timeSlice: 1000, // Envoi toutes les 1s pour plus de fluidité
                ondataavailable: (blob) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        if (wsRef.current?.readyState === WebSocket.OPEN) {
                            wsRef.current.send(reader.result as string);
                        }
                    };
                    reader.readAsDataURL(blob);
                },
            });

            recorder.current = recorderInstance;
            recorder.current.startRecording();
            setIsRecording(true);
        } catch (error) {
            console.error("Micro error:", error);
            alert("Impossible d'accéder au micro.");
        }
    };

    // --- STOP RECORDING ---
    const stopRecording = () => {
        recorder.current?.stopRecording(() => {
            // Callback optionnel à l'arrêt
        });
        setIsRecording(false);

        // Arrêter les pistes du micro (éteindre la lumière rouge du navigateur)
        mediaStream.current?.getTracks().forEach((t) => t.stop());
        mediaStream.current = null;
    };

    // --- CLEAR TEXT ---
    const clearText = () => {
        setFinalTranscript("");
        setPartialTranscript("");
    };

    // --- ON MOUNT ---
    useEffect(() => {
        connectWebSocket();
        return () => {
            wsRef.current?.close();
            stopRecording();
        };
    }, []);

    // --- UI HELPERS ---
    const getStatusVariant = () => {
        switch (connectionStatus) {
            case "connected": return "success";
            case "disconnected": return "danger";
            case "connecting": return "warning";
            default: return "info";
        }
    };

    return (
        <div className="mt-5 px-4 w-100" style={{ margin: 0 }}>

            <h1 className="text-center mb-4">🎙️ Transcription Vosk en Temps Réel</h1>

            <Alert
                variant={getStatusVariant()}
                className="text-center d-flex align-items-center justify-content-center"
            >
                {connectionStatus === "connecting" && (
                    <Spinner animation="border" size="sm" className="me-2"/>
                )}
                {connectionStatus === "connected" && "Connecté au serveur IA."}
                {connectionStatus === "disconnected" &&
                    "Déconnecté. Tentative de reconnexion... ⚠️"}
            </Alert>

            <div className="text-center mb-3 d-flex justify-content-center gap-2">
                <Button
                    variant="primary"
                    onClick={startRecording}
                    disabled={isRecording || connectionStatus !== "connected"}
                    size="lg"
                >
                    {isRecording ? "Enregistrement en cours..." : "▶️ Commencer"}
                </Button>

                <Button
                    variant="danger"
                    onClick={stopRecording}
                    disabled={!isRecording}
                    size="lg"
                >
                    ⏹️ Arrêter
                </Button>

                <Button
                    variant="outline-secondary"
                    onClick={clearText}
                    disabled={!finalTranscript && !partialTranscript}
                    size="lg"
                >
                    🗑️ Effacer le texte
                </Button>
            </div>

            {isRecording && (
                <div className="text-center text-danger fw-bold mb-3">
                    <span className="recording-dot"></span>
                    Micro activé
                </div>
            )}

            <Card className="shadow-sm w-100">
                <Card.Body
                    style={{
                        minHeight: "200px",
                        whiteSpace: "pre-wrap",
                        fontSize: "1.1rem",
                        backgroundColor: "#f8f9fa"
                    }}
                >
                    <span className="text-dark">{finalTranscript}</span>
                    <span className="text-muted fst-italic ms-2">{partialTranscript}</span>

                    {finalTranscript === "" &&
                        partialTranscript === "" && (
                            <div className="text-center text-muted mt-5 opacity-50">
                                <p>Le texte apparaîtra ici...</p>
                            </div>
                        )}
                </Card.Body>
            </Card>

            <p className="mt-3 text-center text-secondary small">Propulsé par Vosk et FastAPI</p>

            <style>{`
                .recording-dot {
                    width: 10px;
                    height: 10px;
                    background-color: red;
                    border-radius: 50%;
                    display: inline-block;
                    margin-right: 8px;
                    animation: blink 1s infinite;
                }
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}

export default TranscriptionDisplay;
