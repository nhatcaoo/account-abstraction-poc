import React, { useState } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { ref, child, get } from "firebase/database";

import { database } from "./firebase";
import { UserContext } from "./UserContext";
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";

import "./App.css";

const dbRef = ref(database);

export default function App() {
    const [userData, setUserData] = useState(null);

    // Firebase query to get user data
    get(child(dbRef, `user`))
        .then((snapshot) => {
            if (snapshot.exists()) {
                setUserData(snapshot.val());
            } else {
                console.log("No data available");
            }
        })
        .catch((error) => {
            console.error(error);
        });

    return (
        <UserContext.Provider value={userData}>
            <Router>
                <Switch>
                    <Route exact path="/" component={LandingPage} />
                    <Route path="/login" component={SignIn} />
                    <Route path="/home" component={HomePage} />
                </Switch>
                <Footer />
            </Router>
        </UserContext.Provider>
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
