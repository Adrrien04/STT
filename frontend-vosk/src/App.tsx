import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import TranscriptionDisplay from "./Pages/TranscriptionDisplay";
import Homepage from "./Pages/Homepage";
import "bootstrap/dist/css/bootstrap.min.css";

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Header/>

            <main
                className="flex-grow-1 w-100"
                style={{
                    background: "var(--bs-light)",
                    minHeight: "100vh",
                    paddingTop: "2rem",
                }}
            >
                <Routes>
                    <Route path="/" element={<Homepage/>}/>
                    <Route path="/transcription" element={<TranscriptionDisplay/>}/>
                </Routes>
            </main>

            <footer className="text-center py-3 text-muted small">
                © {new Date().getFullYear()} Vosk Transcriber — Open Source
            </footer>
        </BrowserRouter>
    );
};

export default App;
