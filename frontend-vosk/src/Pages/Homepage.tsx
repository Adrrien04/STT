import React, { useState } from 'react';
import { Row, Col, Card, Button, Modal } from 'react-bootstrap';
import TranscriptionDisplay from "./TranscriptionDisplay.tsx";

const Homepage: React.FC = () => {
    const [showModal, setShowModal] = useState(false);

    const handleOpen = () => setShowModal(true);
    const handleClose = () => setShowModal(false);

    return (
        <div className="mt-5 px-4">

            <div className="bg-light p-5 rounded-3 mb-4 shadow-sm">
                <h1 className="display-4">Transcription Audio en Temps Réel</h1>
                <p className="lead">
                    Une solution open-source utilisant Vosk, FastAPI et React pour transcrire
                    votre voix instantanément, en 100% local.
                </p>
                <hr className="my-4" />
                <p>
                    Cliquez sur le bouton ci-dessous pour démarrer l'outil de transcription.
                    Assurez-vous que le backend FastAPI est en cours d'exécution.
                </p>

                <Button variant="primary" size="lg" onClick={handleOpen}>
                    Démarrer la Transcription
                </Button>
            </div>

            <Row className="text-center">
                <Col md={4}>
                    <Card className="shadow-sm mb-3">
                        <Card.Body>
                            <Card.Title>🔒 100% Local</Card.Title>
                            <Card.Text>
                                Vos données vocales ne quittent jamais votre machine.
                                Aucune API cloud n'est utilisée.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="shadow-sm mb-3">
                        <Card.Body>
                            <Card.Title>⚡ Temps Réel</Card.Title>
                            <Card.Text>
                                Obtenez une transcription instantanée pendant que vous parlez,
                                grâce aux WebSockets.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="shadow-sm mb-3">
                        <Card.Body>
                            <Card.Title>🐍 Python & React</Card.Title>
                            <Card.Text>
                                La puissance de Vosk et FastAPI combinée à un frontend
                                moderne en React et TypeScript.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Modal show={showModal} onHide={handleClose} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Transcription en Temps Réel</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <TranscriptionDisplay />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Homepage;
