import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import path from 'path';

class StorageService {
  constructor() {
    this.client = null;
    this.bucket = config.storage.bucket;
    this.region = config.storage.region;
    this.provider = config.storage.provider; // 's3' or 'r2'
    this.initialize();
  }

  initialize() {
    const clientConfig = {
      region: this.region,
      credentials: {
        accessKeyId: config.storage.accessKeyId,
        secretAccessKey: config.storage.secretAccessKey
      }
    };

    // Cloudflare R2 specific configuration
    if (this.provider === 'r2') {
      clientConfig.endpoint = config.storage.endpoint;
    }

    this.client = new S3Client(clientConfig);
    logger.info(`✅ Storage service initialized (${this.provider})`);
  }

  /**
   * Generate unique file key
   */
  generateFileKey(originalName, userId, folder = 'voice') {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const sanitizedName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${folder}/${userId}/${timestamp}-${randomString}-${sanitizedName}${ext}`;
  }

  /**
   * Upload file to cloud storage
   */
  async uploadFile(fileBuffer, originalName, userId, options = {}) {
    try {
      const fileKey = this.generateFileKey(originalName, userId, options.folder);
      
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
      logger.error('File upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload from file path (for migration)
   */
  async uploadFromPath(filePath, userId, options = {}) {
    try {
      const fs = await import('fs');
      const fileBuffer = fs.readFileSync(filePath);
      const originalName = path.basename(filePath);
      
      return await this.uploadFile(fileBuffer, originalName, userId, options);
    } catch (error) {
      logger.error('Upload from path error:', error);
      throw new Error(`Failed to upload from path: ${error.message}`);
    }
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(fileKey) {
    if (this.provider === 'r2') {
      // Cloudflare R2 public URL
      return `${config.storage.publicUrl}/${fileKey}`;
    } else {
      // AWS S3 public URL
      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`;
    }
  }

  /**
   * Generate signed URL for private access
   */
  async getSignedUrl(fileKey, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      logger.error('Get signed URL error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(fileKey) {
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

  /**
   * Check if file exists
   */
  async fileExists(fileKey) {
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

  /**
   * Get file metadata
   */
  async getFileMetadata(fileKey) {
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

  /**
   * Download file as buffer
   */
  async downloadFile(fileKey) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey
      });

      const response = await this.client.send(command);
      
      // Convert stream to buffer
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
