import crypto from 'crypto';

/**
 * Encryption utility for sensitive data (SMTP passwords, API keys, etc.)
 * Uses AES-256-GCM for authenticated encryption
 * 
 * SECURITY NOTES:
 * - ENCRYPTION_KEY should be stored in environment variables
 * - Change key to rotate all encrypted values
 * - IV (initialization vector) is generated per encryption for security
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // GCM auth tag

/**
 * Get the encryption key from environment
 * Should be a base64-encoded 32-byte string
 * 
 * For development: Generates a key automatically if not set
 * For production: Throws error if not set (must be configured)
 */
function getEncryptionKey(): Buffer {
  const keyEnv = process.env.ENCRYPTION_KEY;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!keyEnv) {
    if (isProduction) {
      throw new Error(
        'ENCRYPTION_KEY environment variable not set. Generate with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
      );
    }

    // Development mode: Generate a temporary key
    console.warn(
      '\n⚠️  WARNING: ENCRYPTION_KEY not set. Using temporary development key.\n' +
      'For persistent storage across restarts, add to .env.local:\n' +
      'ENCRYPTION_KEY=<run: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))">\n'
    );
    
    return crypto.randomBytes(KEY_LENGTH);
  }

  const key = Buffer.from(keyEnv, 'base64');
  
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 bytes (${KEY_LENGTH * 8} bits). ` +
      `Current length: ${key.length} bytes`
    );
  }

  return key;
}

/**
 * Encrypt sensitive data
 * Returns base64-encoded string containing IV + ciphertext + auth tag
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return '';
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the plaintext
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get the authentication tag
  const authTag = cipher.getAuthTag();

  // Combine: IV + encrypted data + auth tag (all in hex, then convert to base64)
  const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex'), authTag]);
  
  return combined.toString('base64');
}

/**
 * Decrypt sensitive data
 * Expects base64-encoded string from encrypt()
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract components
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(combined.length - AUTH_TAG_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(ciphertext.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a random encryption key (for setup/rotation)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}
