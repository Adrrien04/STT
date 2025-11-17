import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Alert, Spinner } from 'react-bootstrap';


interface VoskMessage {
    text: string;
    type: 'partial' | 'final';

const WEBSOCKET_URL = "ws://localhost:8000/ws/transcribe";

const TranscriptionDisplay: React.FC = () => {
    // Définition des états
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [finalTranscript, setFinalTranscript] = useState<string>("");
    const [partialTranscript, setPartialTranscript] = useState<string>("");
    const wsRef = useRef<WebSocket | null>(null);

    const getStatusVariant = () => {
        switch (connectionStatus) {
            case 'connected': return 'success';
            case 'disconnected': return 'danger';
            case 'connecting': return 'warning';
            default: return 'info';
        }
    };


    const connectWebSocket = () => {

        if (wsRef.current) wsRef.current.close();

        setConnectionStatus('connecting');
        const ws = new WebSocket(WEBSOCKET_URL);
        wsRef.current = ws;

        ws.onopen = () => setConnectionStatus('connected');

        ws.onmessage = (event) => {
            try {
                const data: VoskMessage = JSON.parse(event.data);
                if (data.text) {
                    if (data.type === 'final') {
                        const finalPhrase = data.text.trim();
                        if (finalPhrase) {
                            setFinalTranscript(prev => prev + finalPhrase + ". ");
                            setPartialTranscript("");
                        }
                    } else if (data.type === 'partial') {
                        setPartialTranscript(data.text);
                    }
                }
            } catch (e) {
                console.error("Erreur de parsing JSON :", e);
            }
        };

        ws.onerror = (error) => setConnectionStatus('disconnected');

        ws.onclose = () => {
            setConnectionStatus('disconnected');
            setTimeout(connectWebSocket, 5000); // Tente de reconnecter après 5s
        };
    };

    // Cycle de vie : Se connecte au montage et se nettoie au démontage
    useEffect(() => {
        connectWebSocket();
        return () => {
            if (wsRef.current) wsRef.current.close(1000, "Component unmounted");
        };
    }, []);

    return (
        <div className="mt-5 px-4">
            <h1 className="text-center mb-4">🎙️ Transcription Vosk en Temps Réel</h1>

            <Alert variant={getStatusVariant()}
                   className="text-center d-flex align-items-center justify-content-center">
                {connectionStatus === 'connecting' && <Spinner animation="border" size="sm" className="me-2"/>}

                {connectionStatus === 'connected' && 'Connecté. 🎤 Parlez dans votre micro.'}
                {connectionStatus === 'disconnected' && 'Déconnecté. Tentative de reconnexion... ⚠️'}
                {connectionStatus === 'connecting' && 'Tentative de connexion...'}
            </Alert>

            <Card className="shadow-sm">
                <Card.Body style={{minHeight: '200px', whiteSpace: 'pre-wrap'}}>

                    <span className="font-weight-bold text-dark">{finalTranscript}</span>

                    <span className="text-muted font-italic">{partialTranscript}</span>

                    {finalTranscript === "" && partialTranscript === "" && connectionStatus === 'connected' && (
                        <p className="text-secondary fst-italic">En attente de la parole...</p>
                    )}

                </Card.Body>
            </Card>

            <p className="mt-3 text-center text-secondary">Propulsé par Vosk et FastAPI</p>
        </div>
    );
};

export default TranscriptionDisplay;
