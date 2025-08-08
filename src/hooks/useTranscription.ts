// Custom hook for transcription management

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { api, APIError } from '@/lib/api';
import {
  FileUploadResponse,
  FileInfo,
  TranscriptionRequest,
  TranscriptionResponse,
  ModelSize,
  TaskStatus,
  UploadState,
  TranscriptionState
} from '@/lib/types';

interface UseTranscriptionOptions {
  onSuccess?: (result: TranscriptionResponse) => void;
  onError?: (error: Error) => void;
  pollingInterval?: number;
}

export function useTranscription(options: UseTranscriptionOptions = {}) {
  const { onSuccess, onError, pollingInterval = 2000 } = options;

  // State
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
  });

  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>({
    status: 'pending',
    progress: 0,
  });

  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [uploadedFile, setUploadedFile] = useState<FileUploadResponse | null>(null);

  // Refs
  const stopPollingRef = useRef<(() => void) | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const toastIdRef = useRef<string | number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPollingRef.current?.();
      wsRef.current?.close();
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, []);

  // Upload file
  const uploadFile = useCallback(async (file: File): Promise<FileUploadResponse | null> => {
    setUploadState({
      file,
      uploading: true,
      progress: 0,
      error: undefined,
    });

    toastIdRef.current = toast.loading('Dosya yükleniyor...');

    try {
      const response = await api.uploadFile(file, (progress) => {
        setUploadState(prev => ({ ...prev, progress }));
      });

      setUploadedFile(response);
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
      }));

      toast.success('Dosya yüklendi', { id: toastIdRef.current ?? undefined });
      toastIdRef.current = null;

      // Get file info
      const info = await api.getFileInfo(response.file_id);
      setFileInfo(info);

      return response;
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Yükleme başarısız';
      
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: message,
      }));

      toast.error(message, { id: toastIdRef.current ?? undefined });
      toastIdRef.current = null;
      onError?.(error as Error);
      
      return null;
    }
  }, [onError]);

  // Start transcription
  const startTranscription = useCallback(async (
    fileId: string,
    options: TranscriptionRequest = {}
  ): Promise<void> => {
    setTranscriptionState({
      status: 'processing',
      progress: 0,
      error: undefined,
    });

    toastIdRef.current = toast.loading('Transcription başlatılıyor...');

    try {
      const response = await api.startTranscription(fileId, options);
      
      setTranscriptionState(prev => ({
        ...prev,
        taskId: response.task_id,
        status: response.status,
      }));

      toast.loading('İşlem devam ediyor...', { id: toastIdRef.current ?? undefined });

      // Start polling
      stopPollingRef.current = await api.pollTaskStatus(
        response.task_id,
        (update) => {
          setTranscriptionState(prev => ({
            ...prev,
            status: update.status,
            result: update,
            progress: update.status === 'processing' ? Math.random() * 50 + 25 : // Dynamic progress
                     update.status === 'completed' ? 100 : 
                     update.status === 'failed' ? 0 : prev.progress,
          }));

          if (update.status === 'completed') {
            if (toastIdRef.current) {
              toast.success('Transcription tamamlandı!', { id: toastIdRef.current });
            } else {
              toast.success('Transcription tamamlandı!');
            }
            toastIdRef.current = null;
            onSuccess?.(update);
          } else if (update.status === 'failed') {
            if (toastIdRef.current) {
              toast.error('Transcription başarısız: ' + (update.error || 'Bilinmeyen hata'), { id: toastIdRef.current });
            } else {
              toast.error('Transcription başarısız: ' + (update.error || 'Bilinmeyen hata'));
            }
            toastIdRef.current = null;
            onError?.(new Error(update.error || 'Transcription failed'));
          }
        },
        pollingInterval
      );

      // Optional: Connect WebSocket for real-time updates
      try {
        wsRef.current = api.connectWebSocket(response.task_id, {
          onMessage: (data) => {
            console.log('WebSocket update:', data);
            // Handle real-time updates if needed
            if (data.status && data.progress !== undefined) {
              setTranscriptionState(prev => ({
                ...prev,
                progress: data.progress,
                status: data.status,
              }));
            }
          },
          onError: (error) => {
            console.error('WebSocket error:', error);
          },
          onClose: () => {
            wsRef.current = null;
          },
        });
      } catch (wsError) {
        console.warn('WebSocket connection failed, continuing with polling only:', wsError);
      }

    } catch (error) {
      const message = error instanceof APIError ? error.message : 'Transcription başlatılamadı';
      
      setTranscriptionState(prev => ({
        ...prev,
        status: 'failed',
        error: message,
      }));

      toast.error(message, { id: toastIdRef.current ?? undefined });
      toastIdRef.current = null;
      onError?.(error as Error);
    }
  }, [onSuccess, onError, pollingInterval]);

  // Process file (upload + transcribe)
  const processFile = useCallback(async (
    file: File,
    transcriptionOptions: TranscriptionRequest = {}
  ): Promise<void> => {
    const uploadResult = await uploadFile(file);
    
    if (uploadResult) {
      await startTranscription(uploadResult.file_id, transcriptionOptions);
    }
  }, [uploadFile, startTranscription]);

  // Download result
  const downloadResult = useCallback(async (
    format: 'txt' | 'srt' | 'json'
  ): Promise<void> => {
    if (!transcriptionState.taskId) {
      toast.error('İndirilebilecek transcription sonucu yok');
      return;
    }

    const downloadToast = toast.loading(`${format.toUpperCase()} indiriliyor...`);

    try {
      const blob = await api.downloadResult(transcriptionState.taskId, format);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('İndirme tamamlandı', { id: downloadToast });
    } catch (error) {
      const message = error instanceof APIError ? error.message : 'İndirme başarısız';
      toast.error(message, { id: downloadToast });
    }
  }, [transcriptionState.taskId]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (): Promise<void> => {
    if (!transcriptionState.result?.text) {
      toast.error('Kopyalanacak metin yok');
      return;
    }

    try {
      await navigator.clipboard.writeText(transcriptionState.result.text);
      toast.success('Metin kopyalandı');
    } catch (clipboardError) {
      console.error('Clipboard error:', clipboardError);
      toast.error('Kopyalama başarısız');
    }
  }, [transcriptionState.result]);

  // Cancel operations
  const cancel = useCallback(() => {
    // Cancel upload if in progress
    if (uploadState.file && uploadState.uploading) {
      api.cancelUpload(uploadState.file.name);
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: 'İptal edildi',
      }));
    }

    // Stop polling
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Dismiss any active toasts
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    // Update transcription state
    if (transcriptionState.status === 'processing') {
      setTranscriptionState(prev => ({
        ...prev,
        status: 'failed',
        error: 'İşlem kullanıcı tarafından iptal edildi',
      }));
    }
  }, [uploadState.file, uploadState.uploading, transcriptionState.status]);

  // Reset state
  const reset = useCallback(() => {
    // Cancel any ongoing operations first
    if (uploadState.uploading || transcriptionState.status === 'processing') {
      cancel();
    }

    // Reset all state
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      error: undefined,
    });
    
    setTranscriptionState({
      status: 'pending',
      progress: 0,
      error: undefined,
      taskId: undefined,
      result: undefined,
    });
    
    setFileInfo(null);
    setUploadedFile(null);

    // Cleanup refs
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, [uploadState.uploading, transcriptionState.status, cancel]);

  return {
    // State
    uploadState,
    transcriptionState,
    fileInfo,
    uploadedFile,
    
    // Actions
    uploadFile,
    startTranscription,
    processFile,
    downloadResult,
    copyToClipboard,
    cancel,
    reset,
    
    // Computed
    isProcessing: uploadState.uploading || transcriptionState.status === 'processing',
    isComplete: transcriptionState.status === 'completed',
    hasError: !!uploadState.error || transcriptionState.status === 'failed',
  };    
}
