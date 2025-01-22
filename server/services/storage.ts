import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { IS_PRODUCTION } from "../config";
import { uploadToS3, getFromS3, deleteFromS3 } from "./s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

// Local file system operations
async function writeLocalFile(filePath: string, data: string) {
  const fullPath = path.join(DATA_DIR, filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, data, "utf-8");
}

async function readLocalFile(filePath: string): Promise<string> {
  const fullPath = path.join(DATA_DIR, filePath);
  try {
    return await fs.readFile(fullPath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("File not found");
    }
    throw error;
  }
}

async function deleteLocalFile(filePath: string) {
  const fullPath = path.join(DATA_DIR, filePath);
  try {
    await fs.unlink(fullPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

// Unified storage interface
export async function writeFile(key: string, data: string) {
  if (IS_PRODUCTION) {
    await uploadToS3(key, data);
  } else {
    await writeLocalFile(key, data);
  }
}

export async function readFile(key: string): Promise<string> {
  try {
    if (IS_PRODUCTION) {
      return await getFromS3(key);
    } else {
      return await readLocalFile(key);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "File not found") {
      if (key.endsWith("settings.json")) {
        return "{}";
      }
      return "[]";
    }
    throw error;
  }
}

export async function deleteFile(key: string) {
  if (IS_PRODUCTION) {
    await deleteFromS3(key);
  } else {
    await deleteLocalFile(key);
  }
}