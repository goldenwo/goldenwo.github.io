import React from "react";
import { Container, Row, Col, Image } from "react-bootstrap";
import "./About.css";
import Picture from "../images/professional.png";

const About = () => {
    return (
        <Container fluid className="pt-5 about-container">
            <Row>
                <Col>
                   <Image src={Picture}/>
                </Col>
                <Col>
                    <h1>I'm Golden Wo</h1>
                    <h5>A Boston based software developer with an interest in the financial industry</h5>
                </Col>
            </Row>
        </Container>
    );
};

export default About;
