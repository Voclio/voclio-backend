import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import path from 'path';

class StorageService {
  constructor() {
    this.bucket = config.storage.bucket;
    this.region = config.storage.region;
    this.provider = config.storage.provider;
    this.client = null;
    this.useLocal = this._shouldUseLocalStorage();
    this.localRoot = path.join(process.cwd(), 'uploads');
    this.initialize();
  }

  _shouldUseLocalStorage() {
    if (config.storage.provider === 'local') {
      return true;
    }

    return !config.storage.accessKeyId || !config.storage.secretAccessKey;
  }

  initialize() {
    if (this.useLocal) {
      if (!fs.existsSync(this.localRoot)) {
        fs.mkdirSync(this.localRoot, { recursive: true });
      }
      logger.warn('⚠️  Storage service using local filesystem (cloud credentials not configured)');
      return;
    }

    const clientConfig = {
      region: this.region,
      credentials: {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey
      }
    };

    if (this.provider === 'r2') {
      clientConfig.endpoint = config.storage.endpoint;
    }

    this.client = new S3Client(clientConfig);
    logger.info(`✅ Storage service initialized (${this.provider})`);
  }

  _localPath(fileKey) {
    return path.join(this.localRoot, fileKey);
  }

  generateFileKey(originalName, userId, folder = 'voice') {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const sanitizedName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');

    return `${folder}/${userId}/${timestamp}-${randomString}-${sanitizedName}${ext}`;
  }

  async uploadFile(fileBuffer, originalName, userId, options = {}) {
    const fileKey = this.generateFileKey(originalName, userId, options.folder);

    if (this.useLocal) {
      return this._uploadLocal(fileBuffer, fileKey, options);
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: {
          userId: userId.toString(),
          originalName: originalName,
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      });

      await this.client.send(command);

      const fileUrl = this.getPublicUrl(fileKey);

      logger.info(`File uploaded: ${fileKey}`);

      return {
        key: fileKey,
        url: fileUrl,
        bucket: this.bucket,
        size: fileBuffer.length,
        contentType: options.contentType
      };
    } catch (error) {
      logger.error('Cloud file upload error:', error);
      logger.warn('Falling back to local filesystem storage');
      return this._uploadLocal(fileBuffer, fileKey, options);
    }
  }

  isLocalUrl(url) {
    return typeof url === 'string' && url.startsWith('local://');
  }

  _uploadLocal(fileBuffer, fileKey, options = {}) {
    const fullPath = this._localPath(fileKey);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, fileBuffer);

    logger.info(`File uploaded locally: ${fileKey}`);

    return {
      key: fileKey,
      url: `local://${fileKey}`,
      bucket: 'local',
      size: fileBuffer.length,
      contentType: options.contentType || 'application/octet-stream'
    };
  }

  async uploadFromPath(filePath, userId, options = {}) {
    const fileBuffer = fs.readFileSync(filePath);
    const originalName = path.basename(filePath);
    return await this.uploadFile(fileBuffer, originalName, userId, options);
  }

  getPublicUrl(fileKey) {
    if (this.useLocal) {
      return `local://${fileKey}`;
    }

    if (this.provider === 'r2') {
      return `${config.storage.publicUrl}/${fileKey}`;
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`;
  }

  async getSignedUrl(fileKey, expiresIn = 3600) {
    if (this.useLocal) {
      return this.getPublicUrl(fileKey);
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      logger.error('Get signed URL error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  async deleteFile(fileKey) {
    if (this.useLocal) {
      const fullPath = this._localPath(fileKey);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`Local file deleted: ${fileKey}`);
      }
      return true;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      await this.client.send(command);
      logger.info(`File deleted: ${fileKey}`);

      return true;
    } catch (error) {
      logger.error('File deletion error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async fileExists(fileKey) {
    if (this.useLocal) {
      return fs.existsSync(this._localPath(fileKey));
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async getFileMetadata(fileKey) {
    if (this.useLocal) {
      const fullPath = this._localPath(fileKey);
      const stats = fs.statSync(fullPath);
      return {
        size: stats.size,
        contentType: 'application/octet-stream',
        lastModified: stats.mtime,
        metadata: {}
      };
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      const response = await this.client.send(command);

      return {
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };
    } catch (error) {
      logger.error('Get file metadata error:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  async downloadFile(fileKey) {
    if (this.useLocal) {
      const fullPath = this._localPath(fileKey);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Local file not found: ${fileKey}`);
      }
      return fs.readFileSync(fullPath);
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      const response = await this.client.send(command);

      const chunks = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('File download error:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }
}

export default new StorageService();
