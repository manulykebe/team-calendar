import dotenv from "dotenv";
dotenv.config();

// Environment
export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_PRODUCTION = NODE_ENV === "production";

// Force S3 usage in development for testing
export const FORCE_S3 = process.env.FORCE_S3 === "true";

// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET || "wySWletJvQvvPZNKPnbGxHrO";
export const PORT = parseInt(process.env.PORT || "3000");

// AWS Configuration (used in production or when FORCE_S3 is true)
interface AWSS3Config {
	bucketName: string;
	region: string;
	useArnRregion: boolean;
	credentials: { accessKeyId?: string; secretAccessKey?: string };
}
export const AWS_CONFIG: AWSS3Config = {
	region: process.env.AWS_REGION || "eu-north-1",
	useArnRregion: true,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
	},
	bucketName:
		"arn:aws:s3:eu-north-1:850995545686:accesspoint/" +
		(process.env.AWS_BUCKET_NAME || "azjp"),
};
