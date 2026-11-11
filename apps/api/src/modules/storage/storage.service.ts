import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  CompleteMultipartUploadCommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('storage.accountId', '');
    const accessKeyId = this.configService.get<string>('storage.accessKeyId', '');
    const secretAccessKey = this.configService.get<string>('storage.secretAccessKey', '');
    this.bucketName = this.configService.get<string>('storage.bucketName', 'marshall-uploads');
    this.publicUrl = this.configService.get<string>('storage.publicUrl', 'https://uploads.marshall.com');

    const endpoint = accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : undefined;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  /**
   * Generate a presigned URL for direct S3/R2 upload (PUT)
   */
  async generatePresignedUploadUrl(
    key: string,
    mimeType: string,
    expiresIn = 3600,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: mimeType,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error: any) {
      this.logger.error(`Failed to generate upload URL for key: ${key}`, error);
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  /**
   * Generate a presigned URL for secure download (GET)
   */
  async generatePresignedDownloadUrl(
    key: string,
    fileName?: string,
    expiresIn = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: fileName
          ? `attachment; filename="${encodeURIComponent(fileName)}"`
          : undefined,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error: any) {
      this.logger.error(`Failed to generate download URL for key: ${key}`, error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  /**
   * Initiate a multipart upload session and retrieve uploadId
   */
  async createMultipartUpload(key: string, mimeType: string): Promise<string> {
    try {
      const command = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: mimeType,
      });
      const response = await this.s3Client.send(command);
      if (!response.UploadId) {
        throw new Error('No UploadId returned from storage provider');
      }
      return response.UploadId;
    } catch (error: any) {
      this.logger.error(`Failed to initiate multipart upload for key: ${key}`, error);
      throw new InternalServerErrorException('Failed to initialize multipart upload');
    }
  }

  /**
   * Generate a presigned URL for uploading a single part of a multipart upload
   */
  async generatePresignedPartUrl(
    key: string,
    uploadId: string,
    partNumber: number,
    expiresIn = 3600,
  ): Promise<string> {
    try {
      const command = new UploadPartCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error: any) {
      this.logger.error(
        `Failed to generate part upload URL for key: ${key}, part: ${partNumber}`,
        error,
      );
      throw new InternalServerErrorException('Failed to generate part upload URL');
    }
  }

  /**
   * Complete and finalize a multipart upload session
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ partNumber: number; etag: string }>,
  ): Promise<CompleteMultipartUploadCommandOutput> {
    try {
      const sortedParts = [...parts]
        .sort((a, b) => a.partNumber - b.partNumber)
        .map((p) => ({
          PartNumber: p.partNumber,
          ETag: p.etag.replace(/"/g, ''),
        }));

      const command = new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: sortedParts,
        },
      });

      return await this.s3Client.send(command);
    } catch (error: any) {
      this.logger.error(`Failed to complete multipart upload for key: ${key}`, error);
      throw new InternalServerErrorException('Failed to finalize multipart upload');
    }
  }

  /**
   * Delete an object from storage
   */
  async deleteObject(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (error: any) {
      this.logger.error(`Failed to delete object with key: ${key}`, error);
      throw new InternalServerErrorException('Failed to delete object from storage');
    }
  }

  /**
   * Retrieve metadata for an object in storage
   */
  async getObjectMetadata(key: string): Promise<HeadObjectCommandOutput> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return await this.s3Client.send(command);
    } catch (error: any) {
      this.logger.error(`Failed to get object metadata for key: ${key}`, error);
      throw new InternalServerErrorException('Failed to fetch object metadata');
    }
  }

  /**
   * Form the public CDN URL for a key
   */
  getPublicUrl(key: string): string {
    const trimmedBase = this.publicUrl.endsWith('/')
      ? this.publicUrl.slice(0, -1)
      : this.publicUrl;
    const trimmedKey = key.startsWith('/') ? key.slice(1) : key;
    return `${trimmedBase}/${trimmedKey}`;
  }
}
