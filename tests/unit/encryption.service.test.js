import encryptionService from '../../src/services/encryption.service.js';

describe('EncryptionService', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('should return null for null input', () => {
      expect(encryptionService.encrypt(null)).toBeNull();
      expect(encryptionService.decrypt(null)).toBeNull();
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'test data';
      const encrypted1 = encryptionService.encrypt(plaintext);
      const encrypted2 = encryptionService.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
      expect(encryptionService.decrypt(encrypted1)).toBe(plaintext);
      expect(encryptionService.decrypt(encrypted2)).toBe(plaintext);
    });
  });

  describe('encryptOAuthTokens', () => {
    it('should encrypt OAuth tokens', () => {
      const tokens = {
        access_token: 'access_token_value',
        refresh_token: 'refresh_token_value',
        expires_at: Date.now() + 3600000
      };

      const encrypted = encryptionService.encryptOAuthTokens(tokens);

      expect(encrypted.access_token).not.toBe(tokens.access_token);
      expect(encrypted.refresh_token).not.toBe(tokens.refresh_token);
      expect(encrypted.expires_at).toBe(tokens.expires_at);
    });

    it('should decrypt OAuth tokens', () => {
      const tokens = {
        access_token: 'access_token_value',
        refresh_token: 'refresh_token_value'
      };

      const encrypted = encryptionService.encryptOAuthTokens(tokens);
      const decrypted = encryptionService.decryptOAuthTokens(encrypted);

      expect(decrypted.access_token).toBe(tokens.access_token);
      expect(decrypted.refresh_token).toBe(tokens.refresh_token);
    });
  });

  describe('hash', () => {
    it('should generate consistent hash', () => {
      const data = 'test data';
      const hash1 = encryptionService.hash(data);
      const hash2 = encryptionService.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should generate different hashes for different data', () => {
      const hash1 = encryptionService.hash('data1');
      const hash2 = encryptionService.hash('data2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateToken', () => {
    it('should generate random token', () => {
      const token1 = encryptionService.generateToken();
      const token2 = encryptionService.generateToken();

      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    it('should generate token of specified length', () => {
      const token = encryptionService.generateToken(16);
      expect(token).toHaveLength(32); // 16 bytes = 32 hex characters
    });
  });
});
