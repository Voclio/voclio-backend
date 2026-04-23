/**
 * Storage service unit tests — S3 client mocked via jest.unstable_mockModule (ESM)
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send() {
      return Promise.resolve({
        ContentLength: 1024,
        ContentType: 'audio/mpeg',
        LastModified: new Date(),
        Metadata: {},
        Body: (async function* () { yield Buffer.from('audio data'); })()
      });
    }
  },
  PutObjectCommand:    class { constructor(a) { Object.assign(this, a); } },
  GetObjectCommand:    class { constructor(a) { Object.assign(this, a); } },
  DeleteObjectCommand: class { constructor(a) { Object.assign(this, a); } },
  HeadObjectCommand:   class { constructor(a) { Object.assign(this, a); } }
}));

jest.unstable_mockModule('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: async () => 'https://signed-url.example.com/file.mp3'
}));

const { default: storageService } = await import('../../src/services/storage.service.js');

describe('StorageService', () => {
  describe('generateFileKey', () => {
    it('should generate a unique key with correct structure', () => {
      const key1 = storageService.generateFileKey('recording.mp3', 1, 'voice');
      const key2 = storageService.generateFileKey('recording.mp3', 1, 'voice');
      expect(key1).toMatch(/^voice\/1\//);
      expect(key1).toMatch(/\.mp3$/);
      expect(key1).not.toBe(key2);
    });

    it('should sanitize special characters in filename', () => {
      const key = storageService.generateFileKey('my recording (1).mp3', 42, 'voice');
      expect(key).not.toContain(' ');
      expect(key).not.toContain('(');
    });
  });

  describe('getPublicUrl', () => {
    it('should return correct S3 URL', () => {
      const url = storageService.getPublicUrl('voice/1/test.mp3');
      expect(url).toContain('test-bucket');
      expect(url).toContain('voice/1/test.mp3');
    });
  });

  describe('uploadFile', () => {
    it('should upload buffer and return key + url', async () => {
      const result = await storageService.uploadFile(
        Buffer.from('fake audio'),
        'test.mp3',
        1,
        { folder: 'voice', contentType: 'audio/mpeg' }
      );
      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('url');
      expect(result.key).toMatch(/^voice\/1\//);
    });
  });

  describe('getSignedUrl', () => {
    it('should return a signed URL', async () => {
      const url = await storageService.getSignedUrl('voice/1/test.mp3', 3600);
      expect(url).toBe('https://signed-url.example.com/file.mp3');
    });
  });

  describe('deleteFile', () => {
    it('should call S3 delete and return true', async () => {
      const result = await storageService.deleteFile('voice/1/test.mp3');
      expect(result).toBe(true);
    });
  });
});
