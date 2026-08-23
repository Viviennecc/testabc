// utils/crypto.js

const SECRET_KEY = "your-very-secure-secret-key"; // Replace with a strong key or generate dynamically

// Utility function to encode string to ArrayBuffer
function encodeText(text) {
  return new TextEncoder().encode(text);
}

// Utility function to decode ArrayBuffer to string
function decodeText(buffer) {
  return new TextDecoder().decode(buffer);
}

// Generate a CryptoKey from the secret key
async function getKey() {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encodeText(SECRET_KEY),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Derive a key using PBKDF2
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encodeText("some_salt"), // Use a fixed salt or store it securely
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
  return key;
}

// Encrypt data
export async function encryptData(data) {
  const key = await getKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodeText(data),
  );
  // Combine IV and encrypted data for storage
  const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);
  // Convert to base64 string for storage
  return btoa(String.fromCharCode(...combinedBuffer));
}

// Decrypt data
export async function decryptData(encryptedData) {
  const key = await getKey();
  const combined = atob(encryptedData);
  const combinedBuffer = Uint8Array.from(combined, (c) => c.charCodeAt(0));
  const iv = combinedBuffer.slice(0, 12);
  const encryptedBuffer = combinedBuffer.slice(12);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedBuffer,
  );
  return decodeText(decryptedBuffer);
}
