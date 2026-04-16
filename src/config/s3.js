import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

let s3Client;

export function getS3Client() {
  if (env.storageProvider !== 's3') {
    return null;
  }

  if (!env.awsRegion || !env.awsS3Bucket) {
    throw new Error('AWS_REGION and AWS_S3_BUCKET are required when STORAGE_PROVIDER is set to s3.');
  }

  if (!s3Client) {
    const hasStaticCredentials = env.awsAccessKeyId && env.awsSecretAccessKey;

    s3Client = new S3Client({
      region: env.awsRegion,
      endpoint: env.awsS3Endpoint || undefined,
      forcePathStyle: env.awsS3ForcePathStyle,
      credentials: hasStaticCredentials
        ? {
            accessKeyId: env.awsAccessKeyId,
            secretAccessKey: env.awsSecretAccessKey,
            sessionToken: env.awsSessionToken || undefined
          }
        : undefined
    });
  }

  return s3Client;
}
