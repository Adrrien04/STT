import React, { useState, useEffect, useRef } from "react";
import { Container, Card, Alert, Spinner, Button } from "react-bootstrap";
import RecordRTC, { StereoAudioRecorder } from "recordrtc";

// --- Types ---
type ConnectionStatus = "connecting" | "connected" | "disconnected";

interface VoskMessage {
    text: string;
    type: "partial" | "final";
}

// --- URL du backend ---
const WEBSOCKET_URL = "ws://localhost:8000/ws";

function TranscriptionDisplay() {
    // --- STATES ---
    const [connectionStatus, setConnectionStatus] =
        useState<ConnectionStatus>("connecting");
    const [finalTranscript, setFinalTranscript] = useState<string>("");
    const [partialTranscript, setPartialTranscript] = useState<string>("");
    const [isRecording, setIsRecording] = useState<boolean>(false);

    // --- REFS typés ---
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

            // Ignore le message "Connected"
            if (msg.startsWith("Connected")) return;

            // Partial
            if (msg.startsWith("Partial:")) {
                const text = msg.replace("Partial:", "").trim();
                setPartialTranscript(text);
                return;
            }

            // Final transcription
            if (msg.startsWith("Transcribed:")) {
                const text = msg.replace("Transcribed:", "").trim();
                setFinalTranscript(prev => prev + text + ". ");
                setPartialTranscript("");
                return;
            }

            // Si un jour tu envoies du JSON
            try {
                const data: VoskMessage = JSON.parse(msg);
                if (data.type === "final") {
                    setFinalTranscript(prev => prev + data.text + ". ");
                    setPartialTranscript("");
                } else if (data.type === "partial") {
                    setPartialTranscript(data.text);
                }
            } catch {
                console.warn("Message ignoré (pas du JSON) :", msg);
            }
        };


        ws.onerror = () => setConnectionStatus("disconnected");

        ws.onclose = () => {
            setConnectionStatus("disconnected");
            setTimeout(connectWebSocket, 5000);
        };
    };

    // --- START RECORDING ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStream.current = stream;

            setFinalTranscript("");
            setPartialTranscript("");

            const recorderInstance = new RecordRTC(stream, {
                type: "audio",
                mimeType: "audio/wav",
                recorderType: StereoAudioRecorder,
                sampleRate: 16000,
                timeSlice: 3000,
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
        }
    };

    // --- STOP RECORDING ---
    const stopRecording = () => {
        recorder.current?.stopRecording();
        setIsRecording(false);

        mediaStream.current?.getTracks().forEach((t) => t.stop());
        mediaStream.current = null;
    };

    // --- ON MOUNT ---
    useEffect(() => {
        connectWebSocket();
        return () => {
            wsRef.current?.close(1000, "Component unmounted");
            stopRecording();
        };
    }, []);

    // --- UI ---
    const getStatusVariant = () => {
        switch (connectionStatus) {
            case "connected":
                return "success";
            case "disconnected":
                return "danger";
            case "connecting":
                return "warning";
            default:
                return "info";
        }
    };

    return (
        <Container className="mt-5 px-4" style={{ maxWidth: "700px" }}>
            <h1 className="text-center mb-4">🎙️ Transcription Vosk en Temps Réel</h1>

            <Alert
                variant={getStatusVariant()}
                className="text-center d-flex align-items-center justify-content-center"
            >
                {connectionStatus === "connecting" && (
                    <Spinner animation="border" size="sm" className="me-2" />
                )}
                {connectionStatus === "connected" && "Connecté."}
                {connectionStatus === "disconnected" &&
                    "Déconnecté. Tentative de reconnexion... ⚠️"}
                {connectionStatus === "connecting" && "Tentative de connexion..."}
            </Alert>

            <div className="text-center mb-3">
                <Button
                    variant="primary"
                    onClick={startRecording}
                    disabled={isRecording || connectionStatus !== "connected"}
                    className="me-2"
                    size="lg"
                >
                    {isRecording ? "Enregistrement..." : "Commencer"}
                </Button>
                <Button
                    variant="danger"
                    onClick={stopRecording}
                    disabled={!isRecording}
                    size="lg"
                >
                    Arrêter
                </Button>
            </div>

            {isRecording && (
                <div className="text-center text-danger fw-bold mb-3">
                    <span
                        style={{
                            width: "10px",
                            height: "10px",
                            backgroundColor: "red",
                            borderRadius: "50%",
                            marginRight: "8px",
                            display: "inline-block",
                            animation: "blink 1s infinite",
                        }}
                    ></span>
                    Micro activé...
                </div>
            )}

            <Card className="shadow-sm">
                <Card.Body
                    style={{ minHeight: "200px", whiteSpace: "pre-wrap", fontSize: "1.1rem" }}
                >
                    <span className="fw-bold text-dark">{finalTranscript}</span>
                    <span className="text-muted fst-italic">{partialTranscript}</span>

                    {finalTranscript === "" &&
                        partialTranscript === "" &&
                        connectionStatus === "connected" && (
                            <p className="text-secondary fst-italic">
                                {isRecording ? "En attente de la parole..." : "Appuyez sur 'Commencer' et parlez."}
                            </p>
                        )}
                </Card.Body>
            </Card>

            <p className="mt-3 text-center text-secondary">Propulsé par Vosk et FastAPI</p>

            <style>{`
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0.2; }
                    100% { opacity: 1; }
                }
            `}</style>
        </Container>
    );
}

export default TranscriptionDisplay;
