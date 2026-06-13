import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import path from 'path';

const CLOUDINARY_RESOURCE_TYPE = 'raw';

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

    if (config.storage.provider === 'cloudinary') {
      return (
        !config.storage.cloudName ||
        !config.storage.cloudinaryApiKey ||
        !config.storage.cloudinaryApiSecret
      );
    }

    return !config.storage.accessKeyId || !config.storage.secretAccessKey;
  }

  _isCloudinary() {
    return this.provider === 'cloudinary' && !this.useLocal;
  }

  initialize() {
    if (this.useLocal) {
      if (!fs.existsSync(this.localRoot)) {
        fs.mkdirSync(this.localRoot, { recursive: true });
      }
      logger.warn('⚠️  Storage service using local filesystem (cloud credentials not configured)');
      return;
    }

    if (this._isCloudinary()) {
      cloudinary.config({
        cloud_name: config.storage.cloudName,
        api_key: config.storage.cloudinaryApiKey,
        api_secret: config.storage.cloudinaryApiSecret,
        secure: true
      });
      logger.info('✅ Storage service initialized (cloudinary)');
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

    if (this._isCloudinary()) {
      try {
        return await this._uploadCloudinary(fileBuffer, fileKey, options);
      } catch (error) {
        logger.error('Cloudinary upload error:', error);
        logger.warn('Falling back to local filesystem storage');
        return this._uploadLocal(fileBuffer, fileKey, options);
      }
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

  async _uploadCloudinary(fileBuffer, fileKey, options = {}) {
    const ext = path.extname(fileKey).slice(1);
    const publicId = fileKey.replace(/\.[^/.]+$/, '');

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: CLOUDINARY_RESOURCE_TYPE,
          format: ext || undefined,
          type: 'upload'
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(uploadResult);
        }
      );

      uploadStream.end(fileBuffer);
    });

    logger.info(`File uploaded to Cloudinary: ${result.public_id}`);

    return {
      key: result.public_id,
      url: result.secure_url,
      bucket: config.storage.cloudName,
      size: fileBuffer.length,
      contentType: options.contentType || result.format
    };
  }

  isLocalUrl(url) {
    return (
      typeof url === 'string' &&
      (url.startsWith('local://') || url.startsWith('ephemeral://'))
    );
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

    if (this._isCloudinary()) {
      return cloudinary.url(fileKey, {
        resource_type: CLOUDINARY_RESOURCE_TYPE,
        secure: true
      });
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

    if (this._isCloudinary()) {
      return cloudinary.utils.private_download_url(
        fileKey,
        CLOUDINARY_RESOURCE_TYPE,
        {
          expires_at: Math.floor(Date.now() / 1000) + expiresIn
        }
      );
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

    if (this._isCloudinary()) {
      try {
        await cloudinary.uploader.destroy(fileKey, {
          resource_type: CLOUDINARY_RESOURCE_TYPE,
          invalidate: true
        });
        logger.info(`Cloudinary file deleted: ${fileKey}`);
        return true;
      } catch (error) {
        logger.error('Cloudinary file deletion error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
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

    if (this._isCloudinary()) {
      try {
        await cloudinary.api.resource(fileKey, {
          resource_type: CLOUDINARY_RESOURCE_TYPE
        });
        return true;
      } catch (error) {
        if (error.error?.http_code === 404) {
          return false;
        }
        throw error;
      }
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

    if (this._isCloudinary()) {
      try {
        const resource = await cloudinary.api.resource(fileKey, {
          resource_type: CLOUDINARY_RESOURCE_TYPE
        });

        return {
          size: resource.bytes,
          contentType: resource.format,
          lastModified: new Date(resource.created_at),
          metadata: resource.context?.custom || {}
        };
      } catch (error) {
        logger.error('Get Cloudinary file metadata error:', error);
        throw new Error(`Failed to get file metadata: ${error.message}`);
      }
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

    if (this._isCloudinary()) {
      try {
        const url = this.getPublicUrl(fileKey);
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 60000
        });
        return Buffer.from(response.data);
      } catch (error) {
        logger.error('Cloudinary file download error:', error);
        throw new Error(`Failed to download file: ${error.message}`);
      }
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
