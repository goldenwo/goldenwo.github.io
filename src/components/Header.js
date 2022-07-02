import React from "react";
import { Navbar, Container, Nav } from "react-bootstrap";
import "./Header.css";
import { BrowserRouter as Router, Switch, Route, NavLink } from "react-router-dom";

const Header = () => {
	return (
		<Navbar className="ps-2 pe-2 py-0" bg="light" variant="light" sticky="top">
			<Container>
				<Navbar.Brand>Golden Wo</Navbar.Brand>
			</Container>
			<Container className="justify-content-end">
				<Nav.Link>About</Nav.Link>
				<Nav.Link>Projects</Nav.Link>
				<Nav.Link>Contact Me</Nav.Link>
			</Container>
		</Navbar>
	);
};

export default Header;
