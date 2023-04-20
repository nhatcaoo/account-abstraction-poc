import React, { useState, useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import { Box, TextField, Button } from "@mui/material";
import bcryptjs from "bcryptjs";

import { UserContext } from "../../UserContext";
const crypto = require('crypto');
const SignIn = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [usernameError, setUsernameError] = useState(null);
    const [passwordError, setPasswordError] = useState(null);

    const userData = useContext(UserContext);
    const history = useHistory();

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
        setUsernameError(null);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setPasswordError(null);
    };

    const handleCheckExistsAccount = () => {
        return userData.find((user) => user.id === username);
    };

    const verifyPassword = async (password, hash) => {
        try {
            // Compare the provided password with the stored hash
            const isMatch = await bcryptjs.compare(password, hash);
            return isMatch;
        } catch (error) {
            console.error("Error verifying password:", error);
            throw error;
        }
    };
    const deriveKey = async (passphrase) => {
        // Generate a random salt
        const salt = "0x";

        // Derive a 32-byte key from the passphrase using PBKDF2
        const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');

        return key.toString('hex')
    }
    // Encrypt data using AES-CBC with a given key
    function encryptDataWithKey(key, data) {
        // Generate a random IV (Initialization Vector)
        const iv = crypto.randomBytes(16);

        // Create a cipher using AES-CBC algorithm
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        // Encrypt the data
        const encryptedBuffer = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);

        // Combine the IV and ciphertext into a single Buffer
        const encryptedData = Buffer.concat([iv, encryptedBuffer]);

        // Convert the encrypted data to hexadecimal string
        const encryptedHexString = encryptedData.toString('hex');

        return encryptedHexString;
    }

    const handleSubmit = async () => {
        // Validate input fields
        if (!username) {
            setUsernameError("Please enter a username");
            return;
        }
        if (!password) {
            setPasswordError("Please enter a password");
            return;
        }
        const matchingUser = await handleCheckExistsAccount();
        if (!matchingUser) {
            setUsernameError("Account does not exist");
            return;
        }

        const isMatch = await verifyPassword(
            password,
            matchingUser.hashedPassword
        );
        if (!isMatch) {
            setPasswordError("Password do not match");
            return;
        }

        localStorage.setItem("account", JSON.stringify(matchingUser));
        const encryptedPasswordStr = await deriveKey(password)
        // const encryptedPassword = Buffer.from(encryptedPasswordStr, 'hex');
        localStorage.setItem("encryptedPassword", encryptedPasswordStr)
        history.push("/home");
    };

    return (
        <div className="signin text-center m-5-auto">
            <h2>Sign in to us</h2>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "left",
                    width: "30ch",
                    margin: "0 auto",
                    textAlign: "left",
                }}>
                <p className="signin-form-label">Username</p>
                <TextField
                    autoFocus
                    autoComplete="off"
                    value={username}
                    onChange={handleUsernameChange}
                    error={!!usernameError}
                    helperText={usernameError}
                />
                <p className="signin-form-label">Password</p>
                <TextField
                    autoComplete="off"
                    value={password}
                    type="password"
                    onChange={handlePasswordChange}
                    error={!!passwordError}
                    helperText={passwordError}
                />
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: "30px",
                    gap: "10px",
                    "& .MuiButton-root": {
                        width: "25ch",
                    },
                }}>
                <Button variant="contained" onClick={handleSubmit}>
                    Sign in
                </Button>
                <Button variant="outlined">
                    <Link to="/">BACK TO HOMEPAGE</Link>
                </Button>
            </Box>
        </div>
    );
};

export default SignIn;
