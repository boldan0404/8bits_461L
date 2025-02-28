import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./Login"; // Import your Login component
import ForgotPassword from "./ForgotPassword";

function App() {
  // return <Login />; // Render the Login component
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Define routes for different views */}
          <Route path="/" element={<Login />} /> {/* Login Page */}
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Forgot Password Page */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
