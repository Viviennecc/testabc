import { encryptData, decryptData } from "./crypto";

// Existing encrypted save
export const saveUserData = (userName, key, data) => {
  if (!userName) return;
  const storageKey = `user_${userName}_${key}`;
  localStorage.setItem(storageKey, encryptData(data));
};

// NEW: Raw save for large data like images
export const saveUserDataRaw = (userName, key, data) => {
  if (!userName) return;
  const storageKey = `user_${userName}_${key}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
};

export const getUserData = (userName, key) => {
  if (!userName) return null;
  const storageKey = `user_${userName}_${key}`;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;

  // Try to decrypt; if it fails (returns null), it's probably raw JSON
  const decrypted = decryptData(raw);
  return decrypted ? decrypted : JSON.parse(raw);
};
