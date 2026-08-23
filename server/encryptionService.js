// server/encryptionService.js
import { Aes256Gcm, CipherSuite, HkdfSha256 } from "@hpke/core";
import { MlKem768 } from "@hpke/ml-kem";
import crypto from "crypto";

const suite = new CipherSuite({
  kem: new MlKem768(), // NIST FIPS 203 (Post-Quantum)
  kdf: new HkdfSha256(),
  aead: new Aes256Gcm(),
});

/**
 * World-Class Encryption: Encrypts data for a specific client identity
 * using an Envelope Encryption pattern.
 */
export async function encryptForClient(data, clientPublicKeyJWK) {
  const publicKey = await suite.kem.importKey(clientPublicKeyJWK, "jwk");

  // Encapsulate a shared secret (Quantum-Resistant)
  const { ct, enc } = await suite.setupSeal({ recipientPublicKey: publicKey });

  // Encrypt the actual payload
  const encoder = new TextEncoder();
  const ciphertext = await ct.seal(encoder.encode(JSON.stringify(data)));

  return {
    enc: btoa(String.fromCharCode(...new Uint8Array(enc))), // Encapsulated Key
    data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))), // Ciphertext
  };
}
