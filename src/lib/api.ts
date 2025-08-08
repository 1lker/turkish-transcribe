// Type-safe API client for Turkish Transcription System

import {
  FileUploadResponse,
  FileInfo,
  TranscriptionRequest,
  TranscriptionResponse,
  HealthStatus,
  TaskStatus,
  OutputFormat
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class TranscriptionAPI {
  private baseURL: string;
  private abortControllers: Map<string, AbortController>;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.abortControllers = new Map();
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = 900000  // 15 minutes (15 * 60 * 1000)
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError('Request timeout', 408);
      }
      throw error;
    }
  }

  async health(): Promise<HealthStatus> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/health`, {}, 5000);
      
      if (!response.ok) {
        throw new APIError('Health check failed', response.status);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError('Failed to connect to API');
    }
  }

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // XMLHttpRequest for upload progress
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (error) {
            reject(new APIError('Invalid response format'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new APIError(error.detail || 'Upload failed', xhr.status));
          } catch {
            reject(new APIError('Upload failed', xhr.status));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new APIError('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new APIError('Upload cancelled'));
      });

      xhr.open('POST', `${this.baseURL}/upload`);
      xhr.send(formData);

      // Store abort controller
      this.abortControllers.set(file.name, { abort: () => xhr.abort() } as any);
    });
  }

  cancelUpload(filename: string): void {
    const controller = this.abortControllers.get(filename);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(filename);
    }
  }

  async getFileInfo(fileId: string): Promise<FileInfo> {
    const response = await this.fetchWithTimeout(`${this.baseURL}/file/${fileId}/info`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.detail || 'Failed to get file info',
        response.status
      );
    }

    return await response.json();
  }

  async startTranscription(
    fileId: string,
    options: TranscriptionRequest = {}
  ): Promise<TranscriptionResponse> {
    const response = await this.fetchWithTimeout(
      `${this.baseURL}/transcribe/${fileId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.detail || 'Transcription failed to start',
        response.status
      );
    }

    return await response.json();
  }

  async getTaskStatus(taskId: string): Promise<TranscriptionResponse> {
    const response = await this.fetchWithTimeout(`${this.baseURL}/task/${taskId}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.detail || 'Failed to get task status',
        response.status
      );
    }

    return await response.json();
  }

  async downloadResult(
    taskId: string,
    format: 'txt' | 'srt' | 'json'
  ): Promise<Blob> {
    const response = await this.fetchWithTimeout(
      `${this.baseURL}/task/${taskId}/download/${format}`
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.detail || 'Download failed',
        response.status
      );
    }

    return await response.blob();
  }

  connectWebSocket(
    taskId: string,
    handlers: {
      onMessage?: (data: any) => void;
      onError?: (error: Event) => void;
      onClose?: () => void;
      onOpen?: () => void;
    }
  ): WebSocket {
    const wsURL = `${this.baseURL.replace('http', 'ws')}/ws/${taskId}`;
    const ws = new WebSocket(wsURL);

    ws.onopen = () => {
      console.log('WebSocket connected');
      handlers.onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handlers.onMessage?.(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      handlers.onError?.(error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      handlers.onClose?.();
    };

    return ws;
  }

  async pollTaskStatus(
    taskId: string,
    onUpdate: (response: TranscriptionResponse) => void,
    interval: number = 2000
  ): Promise<() => void> {
    let stopped = false;
    
    const poll = async () => {
      if (stopped) return;
      
      try {
        const response = await this.getTaskStatus(taskId);
        onUpdate(response);
        
        if (response.status === 'completed' || response.status === 'failed') {
          stopped = true;
          return;
        }
        
        setTimeout(poll, interval);
      } catch (error) {
        console.error('Polling error:', error);
        setTimeout(poll, interval * 2); // Retry with longer interval
      }
    };
    
    poll();
    
    // Return stop function
    return () => {
      stopped = true;
    };
  }
}

// Export singleton instance
export const api = new TranscriptionAPI();

// Export error class
export { APIError };