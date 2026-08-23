import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

// Configure fluent-ffmpeg binary path from ffmpeg-static
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export class FfmpegService {
  /**
   * Check if a file is a video or requires audio extraction based on MIME type / extension
   */
  public static isVideoOrNeedsExtraction(mimeType: string = '', originalFileName: string = ''): boolean {
    const ext = path.extname(originalFileName).toLowerCase();
    const isVideoMime = mimeType.startsWith('video/');
    const isVideoExt = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv'].includes(ext);

    return isVideoMime || isVideoExt;
  }

  /**
   * Extract audio track from video file or convert input audio to clean MP3 using FFmpeg
   */
  public static async extractAudio(inputFilePath: string): Promise<string> {
    if (!fs.existsSync(inputFilePath)) {
      throw new Error(`Input file not found for FFmpeg audio extraction: ${inputFilePath}`);
    }

    const ext = path.extname(inputFilePath);
    const outputFilePath = inputFilePath.replace(new RegExp(`${ext}$`, 'i'), '_extracted.mp3');

    console.log(`[FFmpegService] Extracting audio from ${inputFilePath} -> ${outputFilePath}...`);

    return new Promise((resolve, reject) => {
      ffmpeg(inputFilePath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .toFormat('mp3')
        .on('start', (commandLine) => {
          console.log(`[FFmpegService] FFmpeg process started: ${commandLine}`);
        })
        .on('end', () => {
          if (!fs.existsSync(outputFilePath)) {
            return reject(new Error('FFmpeg completed but extracted audio file was not found.'));
          }
          const stats = fs.statSync(outputFilePath);
          console.log(`[FFmpegService] Audio extraction succeeded! Output size: ${stats.size} bytes`);
          resolve(outputFilePath);
        })
        .on('error', (err) => {
          console.error('[FFmpegService] Audio extraction error:', err?.message || err);
          reject(new Error(`Audio extraction failed: ${err?.message || 'FFmpeg conversion error'}`));
        })
        .save(outputFilePath);
    });
  }
}
