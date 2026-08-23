import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { decryptData, encryptData } from "./utils/encryption";
import "./Login.css";

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ loginName: "", password: "" });
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  // Validation States for Login Form
  const [loginFormError, setLoginFormError] = useState("");

  // Validation States for Registration Form
  const [passwordError, setPasswordError] = useState("");
  const [loginNameError, setLoginNameError] = useState("");

  const [regFormData, setRegFormData] = useState({
    loginName: "",
    username: "",
    email: "",
    password: "",
    dateOfBirth: "",
  });

  // --- Validation Helpers ---

  const validateEnglishOnly = (text) => {
    // Allows English letters, numbers, underscores, periods, and hyphens
    const regex = /^[A-Za-z0-9_.-]+$/;
    return regex.test(text);
  };

  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{14,}$/;
    return regex.test(password);
  };

  const validateEmail = (email) => {
    const allowedDomains = [
      "@icloud.com",
      "@gmail.com",
      "@yahoo.com",
      "@hotmail.com",
      "@outlook.com",
    ];
    const lowerEmail = email.toLowerCase();
    return allowedDomains.some((domain) => lowerEmail.endsWith(domain));
  };

  const checkLoginNameExists = (name) => {
    const rawUsers = localStorage.getItem("users");
    const users = JSON.parse(rawUsers || "[]");
    return users.some(
      (u) => u.loginName.trim().toLowerCase() === name.trim().toLowerCase(),
    );
  };

  const handleChange = (e) => {
    const { id, value } = e.target;

    // Real-time check for login form login name
    if (id === "loginName") {
      if (value && !validateEnglishOnly(value)) {
        setLoginFormError(
          "Login name can only use English letters, numbers, and symbols (_, ., -).",
        );
      } else {
        setLoginFormError("");
      }
    }

    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleRegChange = (e) => {
    const { id, value } = e.target;

    // Real-time Login Name check for registration
    if (id === "loginName") {
      if (value && !validateEnglishOnly(value)) {
        setLoginNameError(
          "Login name can only use English letters, numbers, and symbols (_, ., -).",
        );
      } else if (value && checkLoginNameExists(value)) {
        setLoginNameError("This login name is already in use.");
      } else {
        setLoginNameError("");
      }
    }

    // Real-time Password check
    if (id === "password") {
      if (value && !validatePassword(value)) {
        setPasswordError(
          "Min 14 chars: need Uppercase, Lowercase, Number, and Symbol (@$!%*?&#)",
        );
      } else {
        setPasswordError("");
      }
    }

    setRegFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEnglishOnly(formData.loginName)) {
      setLoginFormError("Login name must use English characters only.");
      return;
    }

    try {
      const rawUsers = localStorage.getItem("users");
      const users = JSON.parse(rawUsers || "[]");
      const inputLogin = formData.loginName.trim().toLowerCase();

      const user = users.find(
        (u) => u.loginName.trim().toLowerCase() === inputLogin,
      );
      if (!user) {
        setError("User not found");
        return;
      }

      const decryptedPassword = await decryptData(user.password);
      if (decryptedPassword === formData.password) {
        localStorage.setItem("currentUser", user.username);
        localStorage.setItem(
          "encrypted_user_name",
          await encryptData(user.username),
        );
        if (onLoginSuccess) onLoginSuccess(user.username);
        navigate("/dashboard");
      } else {
        setError("Incorrect password");
      }
    } catch (err) {
      setError("System error: Could not verify credentials.");
    }
  };

  const handleForgotPassword = async () => {
    const loginNameInput = prompt("Please enter your Login Name:");
    if (!loginNameInput) return;

    if (!validateEnglishOnly(loginNameInput)) {
      alert("Login name must use English characters only.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const userIndex = users.findIndex(
      (u) => u.loginName.toLowerCase() === loginNameInput.trim().toLowerCase(),
    );

    if (userIndex === -1) {
      alert("User not found.");
      return;
    }

    const dobCheck = prompt(
      "Security Check: Verify Date of Birth (YYYY-MM-DD):",
    );
    const emailcheck = prompt("Security Check: Verify Email:");

    if (
      dobCheck === users[userIndex].dateOfBirth &&
      emailcheck.toLowerCase() === users[userIndex].email.toLowerCase()
    ) {
      const newPassword = prompt(
        "Verified! Enter new password (min 14 chars, complex):",
      );

      if (!validatePassword(newPassword)) {
        alert(
          "Password rejected! Must be 14+ characters with uppercase, lowercase, numbers, and symbols.",
        );
        return;
      }

      if (newPassword) {
        users[userIndex].password = await encryptData(newPassword);
        localStorage.setItem("users", JSON.stringify(users));
        alert("Password updated successfully!");
      }
    } else {
      alert("Verification failed.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // 1. Check English-only Login Name
    if (!validateEnglishOnly(regFormData.loginName)) {
      setLoginNameError(
        "Login Name can only use English characters, numbers, and symbols (_, ., -).",
      );
      return;
    }

    // 2. Check Login Name Existence
    if (checkLoginNameExists(regFormData.loginName)) {
      setLoginNameError("Login Name already exists. Please choose another.");
      return;
    }

    // 3. Check Password Complexity
    if (!validatePassword(regFormData.password)) {
      alert("Password does not meet security requirements.");
      return;
    }

    // 4. Check Email Domain
    if (!validateEmail(regFormData.email)) {
      alert(
        "Invalid Email. Please use @iCloud, @gmail, @yahoo, @hotmail, or @outlook.",
      );
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const newUser = {
        ...regFormData,
        loginName: regFormData.loginName.trim(),
        password: await encryptData(regFormData.password),
      };
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      alert("Registration successful!");
      setShowRegister(false);
      setPasswordError("");
      setLoginNameError("");
    } catch (err) {
      alert("Error during registration");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Secure Login</h2>
          <p>Access your personal dashboard</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="loginName">Login Name (English only)</label>
            <input
              type="text"
              id="loginName"
              className={`form-input ${loginFormError ? "input-error" : ""}`}
              placeholder="Enter login name"
              value={formData.loginName}
              onChange={handleChange}
              required
            />
            {loginFormError && (
              <p style={{ color: "red", fontSize: "11px", marginTop: "5px" }}>
                {loginFormError}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="button-stack">
            <button
              type="submit"
              className="btn btn-login"
              disabled={!!loginFormError}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn btn-forgot"
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
            <hr className="divider" />
            <button
              type="button"
              className="btn btn-register"
              onClick={() => setShowRegister(true)}
            >
              Create New Account
            </button>
          </div>
        </form>
      </div>

      {showRegister && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Register New User</h3>
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label>
                  Login Name (English letters, numbers, and _ . - only)
                </label>
                <input
                  type="text"
                  id="loginName"
                  value={regFormData.loginName}
                  onChange={(e) => {
                    const originalValue = e.target.value;

                    // 1. Remove any character that is NOT an English letter, number, _, ., or -
                    const cleanedValue = originalValue.replace(
                      /[^a-zA-Z0-9_.-]/g,
                      "",
                    );

                    // 2. If the user tried to type an invalid character, show the error
                    if (originalValue !== cleanedValue) {
                      setLoginNameError(
                        "Login name can only use English letters, numbers, and symbols (_, ., -).",
                      );
                    } else {
                      setLoginNameError("");
                    }

                    // 3. Force the input value to only be the clean, safe text
                    e.target.value = cleanedValue;

                    // 4. Pass the cleaned input event to your main form handler
                    handleRegChange(e);
                  }}
                  className={`form-input ${loginNameError ? "input-error" : ""}`}
                  required
                />
                {loginNameError && (
                  <p
                    style={{ color: "red", fontSize: "11px", marginTop: "5px" }}
                  >
                    {loginNameError}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  id="username"
                  value={regFormData.username}
                  onChange={handleRegChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Password (Min 14 chars, Uppercase, Lowercase, Number, Symbol)
                </label>
                <input
                  type="password"
                  id="password"
                  value={regFormData.password}
                  onChange={handleRegChange}
                  className={`form-input ${passwordError ? "input-error" : ""}`}
                  required
                />
                {passwordError && (
                  <p
                    style={{ color: "red", fontSize: "11px", marginTop: "5px" }}
                  >
                    {passwordError}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={regFormData.dateOfBirth}
                  onChange={handleRegChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Email (@gmail, @icloud, @hotmail, @outlook, @yahoo)
                </label>
                <input
                  type="email"
                  id="email"
                  value={regFormData.email}
                  onChange={handleRegChange}
                  className="form-input"
                  placeholder="name@gmail.com"
                  required
                />
              </div>
              <div className="button-stack">
                <button
                  type="submit"
                  className="btn btn-login"
                  disabled={!!loginNameError || !!passwordError}
                >
                  Register
                </button>
                <button
                  type="button"
                  className="btn btn-cancel"
                  onClick={() => setShowRegister(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
