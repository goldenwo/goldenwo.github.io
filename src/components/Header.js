import React from "react";
import { Navbar, Container, Button } from "react-bootstrap";
import "./Header.css";

const Header = () => {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

	return (
        <Navbar className="ps-2 pe-2 py-0" bg="light" variant="light" sticky="top">
            <Container>
                <Navbar.Brand as={Button} variant="name" onClick={scrollToTop}>Golden Wo</Navbar.Brand>
            </Container>
            <Container className="justify-content-end">
                <Button variant="header">About</Button>
                <Button variant="header">Projects</Button>
                <Button variant="header">Contact Me</Button>
            </Container>
        </Navbar>
	);
};

export default Header;
