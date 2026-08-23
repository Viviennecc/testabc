import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import localforage from "localforage"; // Added missing import
import { decryptData } from "./utils/encryption";
import { saveUserData, getUserData } from "./utils/userStorage";
import { saveToIndexedDB, getFromIndexedDB } from "./utils/db";

// Components
import HKWeather from "./components/HKWeather";
import CalendarEmbed from "./components/CalendarEmbed";
import WorldClock from "./components/WorldClock";
import FlightAwareWidget from "./components/FlightAwareWidget";
import Appearance from "./Appearance";
import Profile from "./Profile";
import Message from "./components/SecureMessagingSystem";
import LHRWeather from "./components/LHRWeather";
import DOHWeather from "./components/DOHWeather";

import "./Dashboard.css";

const Dashboard = ({ userName: propUserName, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- States ---
  const [dateTime, setDateTime] = useState(new Date());
  const [displayUserName, setDisplayUserName] = useState("Guest");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // Appearance States
  const [background, setBackground] = useState({
    type: "color",
    value: "#F0F2F2",
  });
  const [textColor, setTextColor] = useState("#1d1d1f");
  const [textSize, setTextSize] = useState(16);

  // Temporary States (Modals)
  const [tempTextColor, setTempTextColor] = useState("#1d1d1f");
  const [tempTextSize, setTempTextSize] = useState(16);
  const [tempBgColor, setTempBgColor] = useState("#F0F2F2"); // Added missing state
  const [tempImageBase64, setTempImageBase64] = useState("");

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // Inside Dashboard.jsx:
  useEffect(() => {
    if (!propUserName) return;
    const initData = async () => {
      try {
        const settingsKey = `settings_${propUserName}`;
        const savedSettings = await localforage.getItem(settingsKey);

        if (savedSettings) {
          if (savedSettings.background) setBackground(savedSettings.background);
          if (savedSettings.textColor) setTextColor(savedSettings.textColor);
          if (savedSettings.textSize) setTextSize(savedSettings.textSize);
        } else {
          const dbBg = await getFromIndexedDB(`bg_${propUserName}`);
          if (dbBg) setBackground(dbBg);

          const savedText = getUserData(propUserName, "text_preferences");
          if (savedText) {
            setTextColor(savedText.color);
            setTextSize(savedText.size);
          }
        }

        const savedNameEnc = localStorage.getItem("encrypted_user_name");
        if (savedNameEnc) {
          const decryptedName = await decryptData(savedNameEnc);
          setDisplayUserName(decryptedName || propUserName);
        } else {
          setDisplayUserName(propUserName);
        }
      } catch (err) {
        console.error("Dashboard init error:", err);
      }
    };

    initData();
    // Add 'location' here to force data reinvalidation on route changes
  }, [propUserName, location]);

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFinalSave = async () => {
    let finalBg;
    if (tempImageBase64) {
      finalBg = { type: "image", value: tempImageBase64 };
    } else {
      finalBg = { type: "color", value: tempBgColor };
    }

    setBackground(finalBg);
    setTextColor(tempTextColor);
    setTextSize(tempTextSize);

    await localforage.setItem(`settings_${propUserName}`, {
      textColor: tempTextColor,
      textSize: tempTextSize,
      background: finalBg,
    });

    setShowAppearance(false);
  };

  const containerStyle = {
    color: textColor,
    fontSize: `${textSize}px`,
    minHeight: "100vh",
    backgroundColor:
      background.type === "color" ? background.value : "transparent",
    backgroundImage:
      background.type === "image" ? `url(${background.value})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    transition: "background 0.3s ease, color 0.3s ease",
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > MAX_FILE_SIZE) {
      alert("File is too large!");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setTempImageBase64(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const timeString = dateTime.toLocaleTimeString("en-GB", { hour12: false });
  const dateString = dateTime.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="lib-container" style={containerStyle}>
      <aside className="lib-sidebar">
        <div className="lib-brand"> Dashboard</div>
        <div className="lib-welcome-msg">Welcome Back, {displayUserName}</div>
        <div className="lib-time-info">
          {dateString} | <strong>{timeString}</strong>
        </div>
        <nav className="lib-nav-menu">
          <button className="lib-nav-item" onClick={() => setShowProfile(true)}>
            👤 Profile
          </button>
          <button
            className="lib-nav-item"
            onClick={() => setShowMessages(true)}
          >
            📩 Messages
          </button>
          <button
            className="lib-nav-item"
            onClick={() => setShowAppearance(true)}
          >
            🎨 Appearance
          </button>
          <hr style={{ opacity: 0.1, margin: "10px 0" }} />
          <button
            className={`lib-nav-item ${location.pathname === "/dashboard" ? "lib-active" : ""}`}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
          <button className="lib-nav-item" onClick={() => navigate("/library")}>
            Library
          </button>
          <button className="lib-nav-item" onClick={() => navigate("/Blog")}>
            Blog
          </button>
          <button className="lib-nav-item" onClick={() => navigate("/medical")}>
            Medical
          </button>
          <button
            className="lib-nav-item"
            onClick={() => navigate("/AirportWeather")}
          >
            Airport Weather
          </button>
        </nav>
        <div className="lib-footer">
          <button className="lib-nav-item logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="lib-main-content">
        <header className="lib-header">
          <div></div>
          <div className="lib-user-section">
            <div
              className="lib-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {displayUserName.charAt(0).toUpperCase()}
            </div>
            {showUserMenu && (
              <div className="lib-user-menu">
                <div
                  className="lib-user-menu-item"
                  onClick={() => setShowProfile(true)}
                >
                  Profile Settings
                </div>
                <div className="lib-user-menu-item" onClick={onLogout}>
                  Sign Out
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="lib-dashboard-grid">
          <div className="lib-card">
            <CalendarEmbed />
          </div>
          <div className="lib-card">
            <WorldClock />
          </div>
          <div className="lib-card">
            <FlightAwareWidget />
          </div>
          <div className="lib-card">
            <LHRWeather />
          </div>
          <div className="lib-card">
            <DOHWeather />
          </div>
          <div className="lib-card spotify-card">
            <iframe
              src="https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M"
              width="100%"
              height="300"
              frameBorder="0"
              title="Spotify"
              allow="encrypted-media"
              style={{ borderRadius: "12px" }}
            ></iframe>
          </div>
          <div className="lib-card-hkweather">
            <HKWeather />
          </div>
        </div>
      </main>

      <Appearance
        show={showAppearance}
        onClose={() => setShowAppearance(false)}
        textColor={textColor}
        textSize={textSize}
        background={background}
        tempTextColor={tempTextColor}
        setTempTextColor={setTempTextColor}
        tempTextSize={tempTextSize}
        setTempTextSize={setTempTextSize}
        tempBgColor={tempBgColor}
        setTempBgColor={setTempBgColor}
        handleFileChange={handleFileChange}
        handleFinalSave={handleFinalSave}
        tempImageBase64={tempImageBase64}
        setTempImageBase64={setTempImageBase64}
      />

      <Profile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onSave={(u) => setDisplayUserName(u.username)}
      />

      {showMessages && (
        <div className="modal-overlay" onClick={() => setShowMessages(false)}>
          <div
            className="modal-content secure-msg-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowMessages(false)}
            >
              ×
            </button>
            <Message currentUser={displayUserName} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
