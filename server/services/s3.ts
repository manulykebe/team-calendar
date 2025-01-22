import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	ListObjectsV2Command,
	type _Object,
} from "@aws-sdk/client-s3";

import { AWS_CONFIG } from "../config.js";

// Custom error class
class S3OperationError extends Error {
	constructor(operation: string, key: string, originalError: Error) {
		super(
			`Failed to ${operation} object with key ${key}: ${originalError.message}`
		);
		this.name = "S3OperationError";
    console.error(this.message);
	}
}

const s3Client = new S3Client({
	region: AWS_CONFIG.region,
  useArnRegion: AWS_CONFIG.useArnRregion ||true ,
	credentials: {
		accessKeyId: AWS_CONFIG.credentials.accessKeyId || "",
		secretAccessKey: AWS_CONFIG.credentials.secretAccessKey || "",
	},
});

// Upload file to S3
export async function uploadToS3(key: string, data: string) {
	try {
		const command = new PutObjectCommand({
			Bucket: AWS_CONFIG.bucketName,
			Key: key,
			Body: data,
			ContentType: "application/json",
		});
		await s3Client.send(command);
	} catch (error) {
		throw new S3OperationError("upload", key, error as Error);
	}
}

// Download file from S3
export async function getFromS3(key: string): Promise<string> {
	try {
		const command = new GetObjectCommand({
			Bucket: AWS_CONFIG.bucketName,
			Key: key,
		});
		const response = await s3Client.send(command);
		const data = await response.Body?.transformToString();
		if (!data) {
			throw new Error("No data returned from S3");
		}
		return data;
	} catch (error) {
		throw new S3OperationError("download", key, error as Error);
	}
}

// Delete file from S3
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: AWS_CONFIG.bucketName,
      Key: key
    });
    await s3Client.send(command);
  } catch (error) {
    throw new S3OperationError('delete', key, error as Error);
  }
}


// List files in S3 bucket
export async function listS3Objects(prefix?: string): Promise<_Object[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: AWS_CONFIG.bucketName,
      Prefix: prefix
    });
    const response = await s3Client.send(command);
    return response.Contents || [];
  } catch (error) {
    throw new S3OperationError('list', prefix || '', error as Error);
  }
}