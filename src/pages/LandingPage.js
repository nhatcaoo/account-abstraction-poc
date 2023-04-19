import React from "react";
import { Link } from "react-router-dom";

import BackgroundImage from "../assets/images/bg.png";

export default function LandingPage() {
    return (
        <header style={HeaderStyle}>
            <h1 className="main-title text-center">Account abtraction Poc</h1>
            <div className="buttons text-center">
                <Link to="/login">
                    <button className="primary-button">log in</button>
                </Link>
            </div>
        </header>
    );
}

const HeaderStyle = {
    width: "100%",
    height: "100vh",
    background: `url(${BackgroundImage})`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
};
