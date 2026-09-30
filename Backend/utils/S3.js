import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

// Defaults are the original production bucket, so the live server keeps working unchanged
export const S3_BUCKET = process.env.S3_BUCKET_NAME || "interviewos-resumes-915116533522";
export const S3_REGION = process.env.AWS_REGION || "ap-south-1";

const s3 = new S3Client({
  region: S3_REGION,
});

export default s3;
