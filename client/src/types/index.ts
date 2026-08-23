export type MeetingStatus = 'UPLOADED' | 'TRANSCRIBING' | 'SUMMARIZING' | 'COMPLETED' | 'FAILED';

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface ActionItem {
  task: string;
  owner: string | null;
  deadline: string | null;
  priority: PriorityLevel;
}

export interface Meeting {
  id: string;
  title: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  status: MeetingStatus;
  transcript: string | null;
  summary: string | null;
  keyDecisions: string[] | null;
  actionItems: ActionItem[] | null;
  importantPoints: string[] | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
