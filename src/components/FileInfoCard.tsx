'use client';

import { motion } from 'framer-motion';
import { 
  FileAudio, 
  Clock, 
  HardDrive, 
  Radio, 
  Layers, 
  Activity,
  Info,
  Music,
  Video
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileInfo } from '@/lib/types';

interface FileInfoCardProps {
  fileInfo: FileInfo;
}

export default function FileInfoCard({ fileInfo }: FileInfoCardProps) {
  
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSampleRate = (rate: number): string => {
    if (rate >= 1000) {
      return (rate / 1000).toFixed(1) + ' kHz';
    }
    return rate + ' Hz';
  };

  const formatBitRate = (rate?: number): string => {
    if (!rate) return 'Bilinmiyor';
    if (rate >= 1000) {
      return Math.round(rate / 1000) + ' kbps';
    }
    return rate + ' bps';
  };

  const getFileTypeIcon = () => {
    const format = fileInfo.format.toLowerCase();
    
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(format)) {
      return {
        icon: <Video className="w-5 h-5" />,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        type: 'Video',
        gradient: 'from-purple-500 to-pink-500'
      };
    }
    
    if (['mp3', 'wav', 'm4a', 'flac', 'ogg'].includes(format)) {
      return {
        icon: <Music className="w-5 h-5" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        type: 'Audio',
        gradient: 'from-blue-500 to-cyan-500'
      };
    }
    
    return {
      icon: <FileAudio className="w-5 h-5" />,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      type: 'Media',
      gradient: 'from-gray-500 to-gray-600'
    };
  };

  const getQualityBadge = () => {
    const bitRate = fileInfo.bit_rate || 0;
    const sampleRate = fileInfo.sample_rate;
    
    if (bitRate >= 320000 || sampleRate >= 48000) {
      return { label: 'Yüksek Kalite', color: 'bg-green-500/20 text-green-400 border-green-500/50' };
    } else if (bitRate >= 192000 || sampleRate >= 44100) {
      return { label: 'Orta Kalite', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' };
    } else {
      return { label: 'Temel Kalite', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
    }
  };

  const fileType = getFileTypeIcon();
  const quality = getQualityBadge();

  const infoItems = [
    {
      icon: <Clock className="w-4 h-4" />,
      label: 'Süre',
      value: formatDuration(fileInfo.duration),
      detail: `${fileInfo.duration_minutes.toFixed(1)} dakika`
    },
    {
      icon: <HardDrive className="w-4 h-4" />,
      label: 'Boyut',
      value: formatFileSize(fileInfo.file_size),
      detail: `${fileInfo.file_size_mb.toFixed(2)} MB`
    },
    {
      icon: <Radio className="w-4 h-4" />,
      label: 'Sample Rate',
      value: formatSampleRate(fileInfo.sample_rate),
      detail: `${fileInfo.sample_rate} Hz`
    },
    {
      icon: <Layers className="w-4 h-4" />,
      label: 'Kanal',
      value: fileInfo.channels === 1 ? 'Mono' : fileInfo.channels === 2 ? 'Stereo' : `${fileInfo.channels} Kanal`,
      detail: `${fileInfo.channels} channel(s)`
    }
  ];

  if (fileInfo.bit_rate) {
    infoItems.push({
      icon: <Activity className="w-4 h-4" />,
      label: 'Bit Rate',
      value: formatBitRate(fileInfo.bit_rate),
      detail: `${fileInfo.bit_rate} bps`
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-500" />
            Dosya Bilgileri
          </CardTitle>
          <CardDescription>
            Yüklenen medya dosyasının teknik detayları
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Header */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${fileType.gradient}`}>
              {fileType.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-white truncate">{fileInfo.filename}</h3>
                <Badge className={quality.color} variant="outline">
                  {quality.label}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="uppercase font-medium">{fileInfo.format}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{fileType.type}</span>
                {fileInfo.codec && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="uppercase">{fileInfo.codec}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="flex items-center gap-3 p-3 bg-slate-800/20 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="font-semibold text-white">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Info className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-300 mb-1">İşlem Bilgisi</h4>
                <p className="text-xs text-blue-200/80">
                  Dosya başarıyla yüklendi ve analiz edildi. Transcription işlemi için hazır.
                </p>
              </div>
            </div>
          </div>

          {/* Processing Estimate */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Tahmini İşlem Süresi</span>
            </div>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              ~{Math.max(1, Math.ceil(fileInfo.duration_minutes / 4))} dakika
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
