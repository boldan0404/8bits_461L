import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./style.css"; // css file for styling
import axios from "axios"; // Import axios for HTTP requests

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/login", {
                username: username,
                password: password
            });

            setMessage(response.data.message);
            console.log("Login successful:", response.data);
        } catch (error) {
            if (error.response) {
                setMessage(error.response.data.error);
            } else {
                setMessage("Login failed. Please try again.");
            }
            console.error("Login error:", error);
        }

    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>
                <form onSubmit={handleLogin}>
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
                    <button type="submit">Login</button>
                </form>
                {message && <p>{message}</p>}
                {/* Link to Forgot Password */}
                <Link to="/forgot-password" style={{ color: "blue", cursor: "pointer" }}>
                    Forgot your password?
                </Link>
            </div>
        </div>
    );
}

export default Login;
