// frontend/auth.js
import { MlKem768 } from "@hpke/ml-kem";

export async function generateIdentity() {
  const kem = new MlKem768();
  const keyPair = await kem.generateKeyPair();
  const publicKeyJWK = await kem.exportKey("jwk", keyPair.publicKey);

  // Send THIS to your server so the server knows how to encrypt for you
  await fetch("/api/register-device", {
    method: "POST",
    body: JSON.stringify({ publicKey: publicKeyJWK }),
  });

  return keyPair.privateKey; // Keep this in IndexedDB!
}
