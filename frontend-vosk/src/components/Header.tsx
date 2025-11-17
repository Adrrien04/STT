import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
    return (
        <Navbar
            sticky="top"
            bg="dark"
            variant="dark"
            expand="lg"
            className="shadow-sm py-3"
        >
            <Container fluid>
                <Navbar.Brand
                    as={Link}
                    to="/"
                    className="d-flex align-items-center gap-2 fw-bold"
                >
                    <i className="bi bi-soundwave fs-4 text-info"></i>
                    Vosk Transcriber
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar" />

                <Navbar.Collapse id="main-navbar">
                    <Nav className="ms-auto gap-2">
                        <Nav.Link
                            as={Link}
                            to="/"
                            className="px-3 rounded nav-link-custom"
                        >
                            <i className="bi bi-house-door-fill me-1"></i> Accueil
                        </Nav.Link>

                        <Nav.Link
                            as={Link}
                            to="/transcription"
                            className="px-3 rounded nav-link-custom"
                        >
                            <i className="bi bi-mic-fill me-1"></i> Transcription
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>

    );
};

export default Header;
