import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./Login"; // Import your Login component
import ForgotPassword from "./ForgotPassword";
import NewUser from "./NewUser"; // Import New User component
import Projects from "./Projects"

function App() {
    return (
        <Router>
            <div className="app-container">
                <Routes>
                    {/* Define routes for different views */}
                    <Route path="/" element={<Login />} /> {/* Login Page */}
                    <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Forgot Password Page */}
                    <Route path="/new-user" element={<NewUser />} /> {/* New User Registration Page */}
                    <Route path="/projects" element={<Projects />} />  {/* Added route for projects page */}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
