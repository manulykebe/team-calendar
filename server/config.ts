import dotenv from "dotenv";
dotenv.config();

// Environment
export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_PRODUCTION = NODE_ENV === "production";

// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET || "wySWletJvQvvPZNKPnbGxHrO";
export const PORT = parseInt(process.env.PORT || "3000");

// AWS Configuration (only used in production)
export const AWS_CONFIG = {
	region: process.env.AWS_REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
	},
	bucketName: process.env.AWS_BUCKET_NAME || "team-calendar",
};
