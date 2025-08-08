'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileAudio, 
  Film, 
  Mic, 
  X, 
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface FileUploadCardProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  uploadProgress?: number;
}

const ALLOWED_EXTENSIONS = ['mp3', 'wav', 'mp4', 'avi', 'mov', 'mkv', 'webm', 'm4a'];
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB

export default function FileUploadCard({ 
  onFileSelect, 
  isProcessing,
  uploadProgress = 0 
}: FileUploadCardProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return `Desteklenmeyen dosya formatı. Desteklenen formatlar: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `Dosya çok büyük. Maksimum boyut: 5GB`;
    }

    return null;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile && !isProcessing) {
      onFileSelect(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension || '')) {
      return <Film className="w-8 h-8 text-purple-400" />;
    }
    
    if (['mp3', 'wav', 'm4a'].includes(extension || '')) {
      return <FileAudio className="w-8 h-8 text-blue-400" />;
    }
    
    return <FileAudio className="w-8 h-8 text-gray-400" />;
  };

  return (
    <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-500" />
          Dosya Yükle
        </CardTitle>
        <CardDescription>
          Ses veya video dosyanızı yükleyin (Maks: 5GB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 transition-all
            ${dragActive 
              ? 'border-blue-500 bg-blue-500/10 scale-105' 
              : 'border-slate-700 hover:border-slate-600'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${error ? 'border-red-500 bg-red-500/10' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isProcessing && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
            onChange={handleChange}
            disabled={isProcessing}
          />
          
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <Mic className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                <p className="text-sm font-medium text-slate-300 mb-2">
                  {dragActive ? 'Dosyayı bırakın' : 'Dosya seçin veya sürükleyin'}
                </p>
                <p className="text-xs text-slate-500">
                  MP3, WAV, MP4, AVI, MOV, MKV
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center gap-4">
                  {getFileIcon(selectedFile)}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!isProcessing && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveFile}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {selectedFile && (
          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                İşleniyor...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Transcription Başlat
              </>
            )}
          </Button>
        )}

        {isProcessing && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Yükleniyor</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {ALLOWED_EXTENSIONS.map(ext => (
            <Badge 
              key={ext} 
              variant="outline" 
              className="text-xs uppercase"
            >
              {ext}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}