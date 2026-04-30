// =============================================================================
// S3 Helper - Upload e signed URLs para storage de arquivos
// =============================================================================
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const region = process.env.AWS_REGION || 'us-east-1'
const bucket = process.env.AWS_BUCKET_NAME || ''
const prefix = process.env.AWS_FOLDER_PREFIX || ''

export const s3 = new S3Client({ region })

export function buildKey(...parts: string[]): string {
  return [prefix.replace(/\/$/, ''), ...parts.filter(Boolean)]
    .filter(Boolean)
    .join('/')
}

export async function uploadBuffer(
  cloudStoragePath: string,
  buffer: Buffer,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: cloudStoragePath,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  return cloudStoragePath
}

export async function getSignedDownloadUrl(
  cloudStoragePath: string,
  expiresIn = 3600,
): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: bucket, Key: cloudStoragePath }),
    { expiresIn },
  )
}

export async function deleteObject(cloudStoragePath: string) {
  await s3.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: cloudStoragePath }),
  )
}
