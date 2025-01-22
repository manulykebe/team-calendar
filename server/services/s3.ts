import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { AWS_CONFIG } from "../config";

const s3Client = new S3Client({
  region: AWS_CONFIG.region,
  credentials: AWS_CONFIG.credentials,
});

export async function uploadToS3(key: string, data: string) {
  const command = new PutObjectCommand({
    Bucket: AWS_CONFIG.bucketName,
    Key: key,
    Body: data,
    ContentType: "application/json",
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error(`Error uploading to S3: ${key}`, error);
    throw error;
  }
}

export async function getFromS3(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: AWS_CONFIG.bucketName,
    Key: key,
  });

  try {
    const response = await s3Client.send(command);
    const data = await response.Body?.transformToString();
    if (!data) {
      throw new Error("No data returned from S3");
    }
    return data;
  } catch (error) {
    console.error(`Error getting from S3: ${key}`, error);
    throw error;
  }
}

export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: AWS_CONFIG.bucketName,
    Key: key,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error(`Error deleting from S3: ${key}`, error);
    throw error;
  }
}