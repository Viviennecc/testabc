import React, { useState, useEffect, useCallback } from "react";
import {
  createPersistentKeys,
  importUserKey,
  encryptForRecipient,
  decryptForUser,
} from "../utils/encryptionEngine";
import "./SecureMessagingSystem.css";

const SecureMessagingSystem = ({ currentUser }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [inbox, setInbox] = useState([]);
  const [myPrivateKey, setMyPrivateKey] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const initSystem = async () => {
      try {
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const meIndex = users.findIndex((u) => u.username === currentUser);

        if (meIndex !== -1) {
          let me = users[meIndex];

          // Ensure keys exist for the current user
          if (!me.publicKeyJWK || !me.privateKeyJWK) {
            const { publicKeyJWK, privateKeyJWK } =
              await createPersistentKeys();
            users[meIndex].publicKeyJWK = publicKeyJWK;
            users[meIndex].privateKeyJWK = privateKeyJWK;
            localStorage.setItem("users", JSON.stringify(users));
            me = users[meIndex];
          }

          const privKey = await importUserKey(me.privateKeyJWK, "private");
          if (isMounted) setMyPrivateKey(privKey);
        }

        if (isMounted) {
          // Filter out users who don't have public keys yet
          setAvailableUsers(
            users.filter((u) => u.username !== currentUser && u.publicKeyJWK),
          );
        }
      } catch (err) {
        console.error("Key Init Error:", err);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    initSystem();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const fetchMsgs = useCallback(() => {
    const allMsgs = JSON.parse(
      localStorage.getItem("internal_messages") || "[]",
    );
    setInbox(allMsgs.filter((m) => m.recipient === currentUser));
  }, [currentUser]);

  useEffect(() => {
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000);
    return () => clearInterval(interval);
  }, [fetchMsgs]);

  const handleSend = async () => {
    if (!selectedRecipient || !message.trim()) return;

    // VALIDATION: Check if recipient actually has a key
    if (!selectedRecipient.publicKeyJWK) {
      alert(
        "Error: Recipient has no public key registered. They must log in once to generate keys.",
      );
      return;
    }

    try {
      // Import the recipient's public key
      const recipientPubKey = await importUserKey(
        selectedRecipient.publicKeyJWK,
        "public",
      );

      // Encrypt the message
      const encryptedData = await encryptForRecipient(message, recipientPubKey);

      const payload = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: currentUser,
        recipient: selectedRecipient.username,
        subject: subject.trim() || "(No Subject)",
        data: encryptedData,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const all = JSON.parse(localStorage.getItem("internal_messages") || "[]");
      localStorage.setItem(
        "internal_messages",
        JSON.stringify([...all, payload]),
      );

      setMessage("");
      setSubject("");
      alert("Encryption successful. Transmission sent.");
    } catch (err) {
      console.error("Encryption/Send Failure:", err);
      alert(
        "Transmission Failure: Public key import failed. The recipient's key might be corrupted.",
      );
    }
  };

  const handleReadAndDelete = async (pkg) => {
    if (!myPrivateKey) return alert("System Error: Private key not loaded.");

    try {
      const plainText = await decryptForUser(pkg.data, myPrivateKey);
      alert(
        `FROM: ${pkg.sender}\nSUBJECT: ${pkg.subject}\n\nMESSAGE: ${plainText}`,
      );

      // Delete after reading
      const allMsgs = JSON.parse(
        localStorage.getItem("internal_messages") || "[]",
      );
      const updated = allMsgs.filter((m) => m.id !== pkg.id);
      localStorage.setItem("internal_messages", JSON.stringify(updated));
      fetchMsgs();
    } catch (err) {
      console.error("Decryption Failure:", err);
      alert(
        "Decryption Error: This message was not encrypted for your current key pair.",
      );
    }
  };

  if (isInitializing)
    return <div className="msg-loading">Initializing Security Protocol...</div>;

  return (
    <div className="msg-system-card">
      <h3 className="msg-title">🔐 Secure Vault</h3>
      <div className="msg-layout">
        <aside className="msg-contacts-sidebar">
          <span className="msg-section-label">Active Nodes</span>
          {availableUsers.map((u) => (
            <div
              key={u.username}
              className={`msg-user-item ${selectedRecipient?.username === u.username ? "msg-active" : ""}`}
              onClick={() => setSelectedRecipient(u)}
            >
              {u.username}
            </div>
          ))}
        </aside>

        <main className="msg-main-panel">
          <div className="message-composer-container">
            <input
              type="text"
              className="msg-subject-input"
              placeholder="Subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="msg-composer-area"
              placeholder={
                selectedRecipient
                  ? `Secure body for ${selectedRecipient.username}...`
                  : "Select a recipient..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button
            className="msg-send-btn"
            onClick={handleSend}
            disabled={!selectedRecipient || !message.trim()}
          >
            Encrypt & Send
          </button>

          <div className="msg-inbox-section">
            <span className="msg-section-label">Inbox</span>
            <div className="msg-list">
              {inbox.map((m) => (
                <div key={m.id} className="msg-item">
                  <span>
                    {m.sender}: {m.subject}
                  </span>
                  <button
                    className="msg-btn-read"
                    onClick={() => handleReadAndDelete(m)}
                  >
                    🔓 Decrypt
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SecureMessagingSystem;
