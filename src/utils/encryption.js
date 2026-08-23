// utils/encryption.js

const SECRET_KEY = "your-very-secure-secret-key";

function encodeText(text) {
  return new TextEncoder().encode(text);
}

function decodeText(buffer) {
  return new TextDecoder().decode(buffer);
}

async function getKey() {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encodeText(SECRET_KEY),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encodeText("some_salt"),
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

/**
 * Converts a Uint8Array to a Base64 string in a stack-safe way.
 */
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  // Processing in a loop avoids the "Maximum call stack size exceeded" error
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Converts a Base64 string to a Uint8Array in a stack-safe way.
 */
function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Encrypt data
export async function encryptData(data) {
  if (!data) return "";
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

  // Combine IV and encrypted data
  const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combinedBuffer.set(iv, 0);
  combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);

  // Use the new stack-safe conversion
  return arrayBufferToBase64(combinedBuffer);
}

// Decrypt data
export async function decryptData(encryptedData) {
  if (!encryptedData) return "";
  try {
    const key = await getKey();

    // Use the new stack-safe conversion
    const combinedBuffer = base64ToUint8Array(encryptedData);

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
  } catch (err) {
    console.error("Decryption failed:", err);
    return "";
  }
}
