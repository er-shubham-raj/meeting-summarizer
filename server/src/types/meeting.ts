export enum MeetingStatus {
  UPLOADED = 'UPLOADED',
  TRANSCRIBING = 'TRANSCRIBING',
  SUMMARIZING = 'SUMMARIZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface ActionItem {
  task: string;
  owner: string | null;
  deadline: string | null;
  priority: PriorityLevel;
}

export interface MeetingSummaryData {
  summary: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
  importantPoints: string[];
}

export interface MeetingRecord {
  id: string;
  title: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  transcript: string | null;
  summary: string | null;
  keyDecisions: any;
  actionItems: any;
  importantPoints: any;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
