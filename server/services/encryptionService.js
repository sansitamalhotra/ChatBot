// server/services/encryptionService.js
// AES-256-GCM encryption for chat messages at rest.
// Requires MESSAGE_ENCRYPTION_KEY env var (hex or base64). Key must decode to 32 bytes.

const crypto = require('crypto');
const dotenv = require("dotenv");
const { logWithIcon } = require('./consoleIcons');

dotenv.config();

const KEY_ENV = process.env.MESSAGE_ENCRYPTION_KEY;

function getKey() {
  if (!KEY_ENV) {
    logWithIcon.warning('MESSAGE_ENCRYPTION_KEY not set - message encryption disabled');
    return null;
  }

  try {
    let buf;
    
    // Case 1: Hex string (64 characters = 32 bytes)
    if (/^[0-9a-fA-F]+$/.test(KEY_ENV)) {
      if (KEY_ENV.length === 64) {
        buf = Buffer.from(KEY_ENV, 'hex');
      } else if (KEY_ENV.length < 64) {
        logWithIcon.warning(`Hex key too short (${KEY_ENV.length} chars), expected 64. Padding key.`);
        const paddedHex = KEY_ENV.padEnd(64, '0');
        buf = Buffer.from(paddedHex, 'hex');
      } else {
        logWithIcon.warning(`Hex key too long (${KEY_ENV.length} chars), truncating to 64.`);
        buf = Buffer.from(KEY_ENV.substring(0, 64), 'hex');
      }
    }
    // Case 2: Base64 string
    else if (/^[A-Za-z0-9+\/]+=*$/.test(KEY_ENV)) {
      buf = Buffer.from(KEY_ENV, 'base64');
      if (buf.length !== 32) {
        if (buf.length < 32) {
          logWithIcon.warning(`Base64 key produces ${buf.length} bytes, padding to 32`);
          const padded = Buffer.alloc(32);
          buf.copy(padded);
          buf = padded;
        } else {
          logWithIcon.warning(`Base64 key produces ${buf.length} bytes, truncating to 32`);
          buf = buf.slice(0, 32);
        }
      }
    }
    // Case 3: Plain string - derive key using crypto
    else {
      logWithIcon.info('Deriving 32-byte key from plain string using PBKDF2');
      buf = crypto.pbkdf2Sync(KEY_ENV, 'pspl-chat-salt', 10000, 32, 'sha256');
    }
    
    if (buf.length !== 32) {
      throw new Error(`Final key length is ${buf.length} bytes, expected 32`);
    }
    
    logWithIcon.success(`Encryption key validated: 32 bytes (${buf.toString('hex').substring(0, 16)}...)`);
    return buf;
    
  } catch (err) {
    logWithIcon.error('Invalid MESSAGE_ENCRYPTION_KEY:', err.message);
    
    // Auto-generate a development key if in development mode
    if (process.env.NODE_ENV === 'development') {
      logWithIcon.warning('Auto-generating encryption key for development');
      const autoKey = crypto.randomBytes(32);
      logWithIcon.info(`Generated key (save to .env): MESSAGE_ENCRYPTION_KEY=${autoKey.toString('hex')}`);
      return autoKey;
    }
    
    return null;
  }
}

const ALGO = 'aes-256-gcm';

function encrypt(plainText) {
  try {
    const key = getKey();
    if (!key) {
      logWithIcon.info('Encryption disabled - returning plain text');
      return { encrypted: plainText, encryptedFlag: false };
    }

    if (!plainText || typeof plainText !== 'string') {
      logWithIcon.warning('Invalid plainText for encryption');
      return { encrypted: String(plainText || ''), encryptedFlag: false };
    }

    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'), 
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine: iv(12) + authTag(16) + encrypted
    const combined = Buffer.concat([iv, authTag, encrypted]);
    
    return {
      encrypted: combined.toString('base64'),
      encryptedFlag: true
    };
    
  } catch (err) {
    logWithIcon.error('Encryption error:', err.message);
    return { encrypted: String(plainText || ''), encryptedFlag: false };
  }
}

function decrypt(payload) {
  try {
    const key = getKey();
    if (!key) {
      return payload; // Encryption disabled
    }

    if (!payload || typeof payload !== 'string') {
      logWithIcon.warning('Invalid payload for decryption');
      return String(payload || '');
    }

    // Try to decode base64
    let raw;
    try {
      raw = Buffer.from(payload, 'base64');
    } catch (base64Error) {
      logWithIcon.warning('Payload not base64, returning as-is');
      return payload;
    }
    
    // Check minimum size: iv(12) + authTag(16) = 28 bytes minimum
    if (raw.length < 28) {
      logWithIcon.warning('Payload too short for encrypted data, returning as-is');
      return payload;
    }
    
    const iv = raw.slice(0, 12);
    const authTag = raw.slice(12, 28);
    const cipherText = raw.slice(28);
    
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(cipherText), 
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
    
  } catch (err) {
    logWithIcon.error('Decryption error:', err.message);
    // Return original payload to avoid breaking the application
    return payload;
  }
}

function generateKey() {
  const key = crypto.randomBytes(32);
  return {
    hex: key.toString('hex'),
    base64: key.toString('base64')
  };
}

function validateKey(keyString) {
  try {
    const testKey = KEY_ENV;
    process.env.MESSAGE_ENCRYPTION_KEY = keyString;
    const result = getKey();
    process.env.MESSAGE_ENCRYPTION_KEY = testKey; // Restore original
    return !!result;
  } catch (error) {
    return false;
  }
}

// ADDED: formatQuickReplies function to handle the validation error
function formatQuickReplies(quickReplies) {
  if (!quickReplies) return [];
  
  // If already an array, validate and clean it
  if (Array.isArray(quickReplies)) {
    return quickReplies.map(reply => {
      if (typeof reply === 'string') {
        return reply.trim();
      } else if (reply && typeof reply === 'object') {
        // Extract text from object format {text: "...", value: "..."}
        return reply.text || reply.value || String(reply);
      }
      return String(reply || '').trim();
    }).filter(item => item && item.length > 0); // Remove empty values
  }
  
  // If it's a string, try to parse it
  if (typeof quickReplies === 'string') {
    const str = quickReplies.trim();
    
    // Check if it looks like a JSON array or object
    if (str.startsWith('[') || str.startsWith('{')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          return formatQuickReplies(parsed); // Recursive call
        } else if (parsed && typeof parsed === 'object') {
          // Single object, extract text/value
          return [parsed.text || parsed.value || String(parsed)].filter(Boolean);
        }
      } catch (parseError) {
        console.warn('Failed to parse quickReplies JSON:', parseError.message);
        
        // Try regex extraction as fallback
        const textMatches = str.match(/(?:text|value):\s*['"]([^'"]+)['"]/g);
        if (textMatches) {
          return textMatches.map(match => {
            const extracted = match.match(/['"]([^'"]+)['"]/);
            return extracted ? extracted[1] : '';
          }).filter(Boolean);
        }
      }
    }
    
    // Fallback: split by comma
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }
  
  // Last resort: empty array
  console.warn('Unknown quickReplies format:', typeof quickReplies, quickReplies);
  return [];
}

module.exports = {
  encrypt,
  decrypt,
  generateKey,
  validateKey,
  formatQuickReplies, // ADDED: Export the new function
  isEnabled: () => !!getKey()
};
