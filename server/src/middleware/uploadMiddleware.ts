import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '../services/audioService.js';

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `audio-${uniqueSuffix}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(`Invalid file extension '${ext}'. Only ${ALLOWED_EXTENSIONS.join(', ')} formats are allowed.`)
    );
  }

  cb(null, true);
};

export const uploadAudioMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter,
}).single('audio');
