import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

const AppleLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Configuration for Apple
  // Note: These must match your Apple Developer Portal settings exactly
  const APPLE_CONFIG = {
    clientId: "com.yourdomain.webapp.signin",
    redirectURI: window.location.origin + "/login", // Returns to current domain
    scope: "name email",
    state: "origin_state",
  };

  // Detects the return from Apple's website
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (code) {
      // If code exists in URL, Apple has successfully redirected the user back
      setIsLoggedIn(true);
    }
  }, [location]);

  const handleAppleRedirect = () => {
    const rootUrl = `https://appleid.apple.com/auth/authorize`;

    const options = {
      client_id: APPLE_CONFIG.clientId,
      redirect_uri: APPLE_CONFIG.redirectURI,
      response_type: "code",
      scope: APPLE_CONFIG.scope,
      response_mode: "query",
      state: APPLE_CONFIG.state,
    };

    const queryString = new URLSearchParams(options).toString();

    // This line sends the user AWAY from your site to Apple's login page
    window.location.href = `${rootUrl}?${queryString}`;
  };

  // Success view after returning from Apple
  if (isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Success</h2>
          <p>you are login</p>
          <button onClick={() => setIsLoggedIn(false)}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Apple Authentication</h2>
        <p style={{ marginBottom: "20px", fontSize: "0.9rem", color: "#666" }}>
          You will be redirected to Apple to sign in securely.
        </p>

        <button
          onClick={handleAppleRedirect}
          className="apple-login-btn"
          style={{
            backgroundColor: "#000",
            color: "#fff",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            fontSize: "1rem",
          }}
        >
          <img
            src="https://appleid.cdn-apple.com/appleid/button?color=white"
            alt="Apple Logo"
            style={{ height: "18px" }}
          />
          Sign in with Apple
        </button>

        <hr style={{ margin: "20px 0", border: "0.5px solid #eee" }} />

        <button
          className="register-btn"
          onClick={() => navigate("/register")}
          style={{
            background: "none",
            border: "none",
            color: "#007AFF",
            cursor: "pointer",
          }}
        >
          Create New Account
        </button>
      </div>
    </div>
  );
};

export default AppleLogin;
