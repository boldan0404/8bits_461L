import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./style.css"; // css file for styling

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        console.log("Logging in with:", username, password);
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
                {/* Link to Forgot Password */}
      <Link to="/forgot-password" style={{ color: "blue", cursor: "pointer" }}>
        Forgot your password?
      </Link>
            </div>
        </div>
    );
}

export default Login;
