export interface FileMetadata {
  originalFileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface ISpeechToTextProvider {
  transcribe(filePath: string, fileMeta?: FileMetadata): Promise<string>;
}
