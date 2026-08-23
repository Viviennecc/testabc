// src/utils/encryptionEngine.js

const RSA_PARAMS = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

export const createPersistentKeys = async () => {
  const keyPair = await window.crypto.subtle.generateKey(RSA_PARAMS, true, [
    "encrypt",
    "decrypt",
  ]);
  const publicKeyJWK = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.publicKey,
  );
  const privateKeyJWK = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey,
  );
  return { publicKeyJWK, privateKeyJWK };
};

export const importUserKey = async (jwk, type) => {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    type === "private" ? ["decrypt"] : ["encrypt"],
  );
};

export const encryptForRecipient = async (message, recipientPublicKey) => {
  const encoder = new TextEncoder();
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"],
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(message),
  );
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    exportedAesKey,
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedContent))),
    encryptedAesKey: btoa(
      String.fromCharCode(...new Uint8Array(encryptedAesKey)),
    ),
    iv: btoa(String.fromCharCode(...iv)),
  };
};

export const decryptForUser = async (pkg, privateKey) => {
  const decoder = new TextDecoder();
  const encryptedAesKey = Uint8Array.from(atob(pkg.encryptedAesKey), (c) =>
    c.charCodeAt(0),
  );
  const ciphertext = Uint8Array.from(atob(pkg.ciphertext), (c) =>
    c.charCodeAt(0),
  );
  const iv = Uint8Array.from(atob(pkg.iv), (c) => c.charCodeAt(0));

  const aesKeyBuf = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedAesKey,
  );
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    aesKeyBuf,
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const result = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext,
  );

  return decoder.decode(result);
};
