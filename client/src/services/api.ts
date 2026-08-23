import axios from 'axios';
import { ApiResponse, Meeting, MeetingStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  /**
   * Health check
   */
  checkHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  /**
   * Upload meeting audio file
   */
  uploadAudio: async (file: File, title?: string): Promise<ApiResponse<{ id: string; status: MeetingStatus }>> => {
    const formData = new FormData();
    formData.append('audio', file);
    if (title) {
      formData.append('title', title);
    }

    const res = await client.post('/meetings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  },

  /**
   * Fetch all meetings
   */
  getMeetings: async (search?: string): Promise<ApiResponse<Meeting[]>> => {
    const res = await client.get('/meetings', {
      params: { search },
    });
    return res.data;
  },

  /**
   * Fetch full meeting details by ID
   */
  getMeetingById: async (id: string): Promise<ApiResponse<Meeting>> => {
    const res = await client.get(`/meetings/${id}`);
    return res.data;
  },

  /**
   * Fast status check polling endpoint
   */
  getMeetingStatus: async (id: string): Promise<ApiResponse<{ status: MeetingStatus; errorMessage?: string }>> => {
    const res = await client.get(`/meetings/${id}/status`);
    return res.data;
  },

  /**
   * Delete meeting by ID
   */
  deleteMeeting: async (id: string): Promise<ApiResponse<void>> => {
    const res = await client.delete(`/meetings/${id}`);
    return res.data;
  },
};
