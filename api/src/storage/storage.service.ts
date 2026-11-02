import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

export interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>(
      "AWS_S3_BUCKET",
      "hireflow-uploads",
    );

    const endpoint = this.configService.get<string>("AWS_S3_ENDPOINT");
    const accessKeyId = this.configService.get<string>("AWS_ACCESS_KEY_ID", "");
    const secretAccessKey = this.configService.get<string>(
      "AWS_SECRET_ACCESS_KEY",
      "",
    );

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        "AWS/MinIO credentials are missing in .env! Storage service will likely fail to authenticate.",
      );
    }

    this.s3Client = new S3Client({
      region: this.configService.get<string>("AWS_REGION", "us-east-1"),
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: !!endpoint,
    });
  }

  async onModuleInit() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      this.logger.log(`Bucket "${this.bucketName}" already exists.`);
    } catch (err: unknown) {
      const error = err as Error & { $metadata?: { httpStatusCode?: number } };
      const statusCode = error.$metadata?.httpStatusCode;

      if (error.name === "NotFound" || statusCode === 404) {
        this.logger.log(`Bucket "${this.bucketName}" not found. Creating...`);
        try {
          await this.s3Client.send(
            new CreateBucketCommand({ Bucket: this.bucketName }),
          );
          this.logger.log(`Bucket "${this.bucketName}" created successfully.`);
        } catch (createErr) {
          this.logger.error(
            `Failed to create bucket: ${(createErr as Error).message}`,
          );
        }
      } else if (statusCode === 403 || error.name === "UnknownError") {
        this.logger.error(
          `Access Denied (403) or UnknownError to bucket "${this.bucketName}". ` +
            `Please check if MinIO is running and your AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY are correct in the .env file.`,
        );
        if (error.stack) this.logger.error(error.stack);
      } else {
        this.logger.error(
          `Error checking bucket "${this.bucketName}". HTTP Status: ${statusCode}. Message: ${error.message}`,
          error?.stack,
        );
      }
    }
  }

  async upload(file: MulterFile, key: string): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await this.s3Client.send(command);
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Failed to upload file: ${key}`, error?.stack);
      throw new InternalServerErrorException("File upload failed");
    }
  }

  async download(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Failed to download file: ${key}`, error?.stack);
      throw new InternalServerErrorException("File download failed");
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(`Failed to delete file: ${key}`, error?.stack);
      throw new InternalServerErrorException("File deletion failed");
    }
  }

  async getPresignedUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      // URL expires in 60 minutes (3600 seconds)
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      });
      return String(url);
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error(
        `Failed to generate presigned URL: ${key}`,
        error?.stack,
      );
      throw new InternalServerErrorException(
        "Could not generate temporary URL",
      );
    }
  }
}
