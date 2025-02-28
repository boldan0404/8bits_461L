import React, { useState } from "react";
import "./style.css";

function ForgotPassword() {
    const [email, setEmail] = useState("")

    const handleForgotPassword = (e) => {
        e.preventDefault();
        console.log("Sending password reset link to", email);

        // Placeholder for sending email to backend
        // Use http request or something, not sure how rn

    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-box">
                <h2>Forgot Password?</h2>
                <p>Please enter your email address to reset your password.</p>

                <form onSubmit={handleForgotPassword}>
                    <label htmlFor="email">Email Address:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} // Update state on input change
                    />

                    <button type="submit">Send Reset Link</button>
                </form>
            </div>
        </div>
    );
}

export default ForgotPassword