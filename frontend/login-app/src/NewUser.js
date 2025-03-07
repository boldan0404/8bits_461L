import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css"; // css file for styling
import axios from "axios"; // Import axios for HTTP requests

function NewUser() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/register", {
                username: username,
                password: password
            });

            setMessage(response.data.message);
            console.log("Registration successful:", response.data);
            setTimeout(() => navigate("/"), 2000); // Redirect to login page
        } catch (error) {
            if (error.response) {
                setMessage(error.response.data.error);
            } else {
                setMessage("Registration failed. Please try again.");
            }
            console.error("Registration error:", error);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>New User Registration</h2>
                <form onSubmit={handleRegister}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Register</button>
                </form>
                {message && <p>{message}</p>}
            </div>
        </div>
    );
}

export default NewUser;
