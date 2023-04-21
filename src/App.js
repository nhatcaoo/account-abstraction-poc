import React from "react";
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
        </Router>
    );
}
