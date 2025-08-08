// Type definitions for Turkish Transcription System

export interface FileUploadResponse {
  file_id: string;
  filename: string;
  size: number;
  path: string;
}

export interface FileInfo {
  filename: string;
  format: string;
  duration: number;
  duration_minutes: number;
  sample_rate: number;
  channels: number;
  codec?: string;
  bit_rate?: number;
  file_size: number;
  file_size_mb: number;
}

export type ModelSize = 'tiny' | 'base' | 'small' | 'medium' | 'large';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type OutputFormat = 'json' | 'txt' | 'srt' | 'vtt' | 'all';
export type DeviceType = 'cpu' | 'cuda' | 'auto';

export interface TranscriptionRequest {
  model_size?: ModelSize;
  language?: string;
  device?: DeviceType;
  apply_vad?: boolean;
  normalize_audio?: boolean;
  output_format?: OutputFormat;
  initial_prompt?: string;
  temperature?: number;
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  tokens?: number[];
  temperature?: number;
  avg_logprob?: number;
  compression_ratio?: number;
  no_speech_prob?: number;
}

export interface TranscriptionResponse {
  task_id: string;
  status: TaskStatus;
  text?: string;
  segments?: TranscriptionSegment[];
  language?: string;
  duration?: number;
  processing_time?: number;
  model_size?: ModelSize;
  device?: DeviceType;
  word_count?: number;
  character_count?: number;
  output_files?: Record<string, string>;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  whisper_model_loaded: boolean;
  available_models: string[];
  gpu_available: boolean;
  gpu_name?: string;
}

export interface ModelInfo {
  speed: string;
  quality: string;
  size: string;
  description: string;
}

export interface ModelConfig {
  [key: string]: ModelInfo;
}

export interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error?: string;
}

export interface TranscriptionState {
  taskId?: string;
  status: TaskStatus;
  progress: number;
  stage?: string;
  message?: string;
  result?: TranscriptionResponse;
  error?: string;
}

export interface AppState {
  health?: HealthStatus;
  upload: UploadState;
  transcription: TranscriptionState;
  selectedModel: ModelSize;
  fileInfo?: FileInfo;
}