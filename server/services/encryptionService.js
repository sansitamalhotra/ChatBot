// server/services/encryptionService.js
// AES-256-GCM encryption for chat messages at rest.
// Requires MESSAGE_ENCRYPTION_KEY env var (hex or base64). Key must decode to 32 bytes.
const crypto = require('crypto');
const dotenv = require("dotenv");
const { logWithIcon } = require('./consoleIcons');

dotenv.config();

const KEY_ENV = process.env.MESSAGE_ENCRYPTION_KEY;
if (!KEY_ENV) {
  logWithIcon.warning('WARNING: MESSAGE_ENCRYPTION_KEY not set - message encryption disabled.');
}

function getKey() {
  if (!KEY_ENV) return null;
  // Try hex then base64 decode
  let buf;
  try {
    // hex length 64 -> 32 bytes
    if (/^[0-9a-fA-F]+$/.test(KEY_ENV) && KEY_ENV.length === 64) {
      buf = Buffer.from(KEY_ENV, 'hex');
    } else {
      buf = Buffer.from(KEY_ENV, 'base64');
    }
    if (buf.length !== 32) {
      throw new Error('Encryption key must be 32 bytes');
    }
    return buf;
  } catch (err) {
    console.error('Invalid MESSAGE_ENCRYPTION_KEY:', err.message);
    return null;
  }
}

const ALGO = 'aes-256-gcm';

function encrypt(plainText) {
  try {
    const key = getKey();
    if (!key) return { encrypted: plainText, encryptedFlag: false };

    const iv = crypto.randomBytes(12); // recommended 96-bit iv for GCM
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // return base64 combined payload
    return {
      encrypted: Buffer.concat([iv, authTag, encrypted]).toString('base64'),
      encryptedFlag: true
    };
  } catch (err) {
    logWithIcon.error('encrypt error:', err);
    return { encrypted: plainText, encryptedFlag: false };
  }
}

function decrypt(payload) {
  try {
    const key = getKey();
    if (!key) return payload; // no-op: encryption disabled

    // payload is base64 -> iv(12) + authTag(16) + cipherText
    const raw = Buffer.from(payload, 'base64');
    const iv = raw.slice(0, 12);
    const authTag = raw.slice(12, 28);
    const cipherText = raw.slice(28);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    logWithIcon.error('decrypt error:', err);
    // In case of decryption failure, return original payload to avoid breaking responses
    return payload;
  }
}
module.exports = {
  encrypt,
  decrypt
};
