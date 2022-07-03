import React from "react";
import { Container, Button } from "react-bootstrap";
import "./Contact.css";
import { BsLinkedin, BsGithub } from "react-icons/bs";

const Contact = () => {
    return (
        <Container fluid className="pt-2 contact-container">
            <h4>My contact information</h4>
            <p className="mb-0">wogolden4@gmail.com</p>
            <Container>
                <Button variant="contact" href="https://www.linkedin.com/in/goldenwo/" target="_blank">
                    <BsLinkedin /> LinkedIn
                </Button>
                <Button variant="contact" href="https://github.com/goldenwo" target="_blank">
                    <BsGithub /> Github
                </Button>
            </Container>
        </Container>
    );
};

export default Contact;