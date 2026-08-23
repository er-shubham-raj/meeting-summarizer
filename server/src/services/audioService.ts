import fs from 'fs';
import path from 'path';

export const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'video/mp4',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
];

export const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.mp4', '.webm', '.ogg', '.aac'];

// Max size 25 MB (OpenAI API limit)
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export class AudioService {
  /**
   * Validate audio file extension, mime type, and file size
   */
  public static validateAudioFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file uploaded.' };
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `Unsupported file extension '${ext}'. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 25 MB.`,
      };
    }

    return { valid: true };
  }

  /**
   * Remove a temporary file safely
   */
  public static async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.error(`[AudioService] Error cleaning up temporary file ${filePath}:`, err);
    }
  }
}
