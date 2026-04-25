import crypto from 'crypto';
import config from '../config/index.js';
import logger from '../utils/logger.js';

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.saltLength = 64;
    this.tagLength = 16;
    this.encryptionKey = this.deriveKey(config.encryption.secret);
  }

  /**
   * Derive encryption key from secret
   */
  deriveKey(secret) {
    return crypto.scryptSync(secret, 'salt', this.keyLength);
  }

  /**
   * Encrypt data
   */
  encrypt(plaintext) {
    try {
      if (!plaintext) {
        return null;
      }

      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine IV + authTag + encrypted data
      const result = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);

      // Return as base64
      return result.toString('base64');
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData) {
    try {
      if (!encryptedData) {
        return null;
      }

      // Convert from base64
      const buffer = Buffer.from(encryptedData, 'base64');

      // Extract IV, authTag, and encrypted data
      const iv = buffer.subarray(0, this.ivLength);
      const authTag = buffer.subarray(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = buffer.subarray(this.ivLength + this.tagLength);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, null, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data (one-way)
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt OAuth tokens
   */
  encryptOAuthTokens(tokens) {
    if (!tokens) {
      return null;
    }

    return {
      access_token: tokens.access_token ? this.encrypt(tokens.access_token) : null,
      refresh_token: tokens.refresh_token ? this.encrypt(tokens.refresh_token) : null,
      id_token: tokens.id_token ? this.encrypt(tokens.id_token) : null,
      expires_at: tokens.expires_at,
      scope: tokens.scope
    };
  }

  /**
   * Decrypt OAuth tokens
   */
  decryptOAuthTokens(encryptedTokens) {
    if (!encryptedTokens) {
      return null;
    }

    return {
      access_token: encryptedTokens.access_token
        ? this.decrypt(encryptedTokens.access_token)
        : null,
      refresh_token: encryptedTokens.refresh_token
        ? this.decrypt(encryptedTokens.refresh_token)
        : null,
      id_token: encryptedTokens.id_token ? this.decrypt(encryptedTokens.id_token) : null,
      expires_at: encryptedTokens.expires_at,
      scope: encryptedTokens.scope
    };
  }

  /**
   * Encrypt sensitive field
   */
  encryptField(value) {
    if (!value) {
      return null;
    }
    return this.encrypt(String(value));
  }

  /**
   * Decrypt sensitive field
   */
  decryptField(encryptedValue) {
    if (!encryptedValue) {
      return null;
    }
    return this.decrypt(encryptedValue);
  }
}

export default new EncryptionService();
