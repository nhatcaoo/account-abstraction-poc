import React, { useState } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";

import "./App.css";


export default function App() {


    return (
        <Router>
            <Switch>
                <Route exact path="/" component={LandingPage} />
                <Route path="/login" component={SignIn} />
                <Route path="/home" component={HomePage} />
            </Switch>
            <Footer />
        </Router>
    );
}

const Footer = () => {
    return (
        <p className="text-center" style={FooterStyle}>
            Designed & coded by{" "}
            <a
                href="https://izemspot.netlify.com"
                target="_blank"
                rel="noopener noreferrer">
                ABC
            </a>
        </p>
    );
};

const FooterStyle = {
    background: "#222",
    fontSize: ".8rem",
    color: "#fff",
    position: "absolute",
    bottom: 0,
    padding: "1rem",
    margin: 0,
    width: "100%",
    opacity: ".5",
};
