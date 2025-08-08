'use client';

import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Clock, 
  FileText, 
  Zap, 
  Target, 
  Volume2, 
  Activity,
  TrendingUp,
  Hash,
  Timer,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TranscriptionResponse } from '@/lib/types';

interface StatsCardProps {
  transcription: TranscriptionResponse;
}

export default function StatsCard({ transcription }: StatsCardProps) {
  
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatProcessingTime = (seconds?: number): string => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  };

  const getSpeedRatio = (): number => {
    if (!transcription.duration || !transcription.processing_time) return 0;
    return transcription.duration / transcription.processing_time;
  };

  const getModelBadgeColor = (model?: string) => {
    switch (model) {
      case 'tiny': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'base': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'small': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'medium': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'large': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getQualityScore = (): number => {
    // Basit bir kalite skoru hesaplaması
    const segmentCount = transcription.segments?.length || 0;
    const wordCount = transcription.word_count || 0;
    const duration = transcription.duration || 1;
    
    // Dakika başına kelime sayısı
    const wordsPerMinute = (wordCount / duration) * 60;
    
    // Segment yoğunluğu (daha az segment = daha az kesinti = daha iyi)
    const segmentDensity = segmentCount / (duration / 60);
    
    // Kalite skoru (0-100)
    let score = 70; // Base score
    
    if (wordsPerMinute > 100) score += 10;
    else if (wordsPerMinute > 80) score += 5;
    
    if (segmentDensity < 10) score += 10;
    else if (segmentDensity < 15) score += 5;
    
    return Math.min(100, Math.max(0, score));
  };

  const speedRatio = getSpeedRatio();
  const qualityScore = getQualityScore();

  const stats = [
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Ses Süresi',
      value: formatDuration(transcription.duration),
      detail: `${transcription.duration?.toFixed(1)} saniye`,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      icon: <Timer className="w-5 h-5" />,
      label: 'İşlem Süresi',
      value: formatProcessingTime(transcription.processing_time),
      detail: speedRatio > 0 ? `${speedRatio.toFixed(1)}x hızında` : '',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      icon: <Hash className="w-5 h-5" />,
      label: 'Kelime Sayısı',
      value: (transcription.word_count || 0).toLocaleString(),
      detail: `${transcription.character_count || 0} karakter`,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Segment Sayısı',
      value: (transcription.segments?.length || 0).toString(),
      detail: transcription.segments?.length ? `Ortalama ${(transcription.duration! / transcription.segments.length).toFixed(1)}s` : '',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20'
    }
  ];

  const performanceMetrics = [
    {
      label: 'Hız Performansı',
      value: speedRatio,
      max: 20,
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      unit: 'x',
      icon: <Zap className="w-4 h-4" />
    },
    {
      label: 'Kalite Skoru',
      value: qualityScore,
      max: 100,
      color: 'bg-gradient-to-r from-blue-500 to-purple-500',
      unit: '%',
      icon: <Target className="w-4 h-4" />
    }
  ];

  const processingInfo = [
    {
      icon: <Cpu className="w-4 h-4" />,
      label: 'Model',
      value: transcription.model_size?.toUpperCase() || 'UNKNOWN'
    },
    {
      icon: <Activity className="w-4 h-4" />,
      label: 'Device',
      value: transcription.device?.toUpperCase() || 'AUTO'
    },
    {
      icon: <Volume2 className="w-4 h-4" />,
      label: 'Dil',
      value: transcription.language === 'tr' ? 'Türkçe' : (transcription.language || 'Auto').toUpperCase()
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-gray-800 bg-gray-900/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-500" />
                İşlem İstatistikleri
              </CardTitle>
              <CardDescription>
                Transcription süreci hakkında detaylı bilgiler
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Tamamlandı
              </Badge>
              <Badge className={getModelBadgeColor(transcription.model_size)} variant="outline">
                {transcription.model_size?.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-white mb-1">{stat.value}</p>
                {stat.detail && (
                  <p className="text-xs text-gray-500">{stat.detail}</p>
                )}
              </motion.div>
            ))}
          </div>

          <Separator className="bg-gray-700" />

          {/* Performance Metrics */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              Performans Metrikleri
            </h3>
            <div className="space-y-4">
              {performanceMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.4 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-gray-400">
                        {metric.icon}
                      </div>
                      <span className="text-sm text-gray-300">{metric.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {metric.value.toFixed(1)}{metric.unit}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={(metric.value / metric.max) * 100} 
                      className="h-2"
                    />
                    <div 
                      className={`absolute top-0 left-0 h-2 rounded-full ${metric.color}`}
                      style={{ width: `${Math.min((metric.value / metric.max) * 100, 100)}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Processing Info */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              İşlem Detayları
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {processingInfo.map((info, index) => (
                <motion.div
                  key={info.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.6 }}
                  className="text-center p-3 bg-gray-800/20 rounded-lg border border-gray-700"
                >
                  <div className="flex justify-center mb-2 text-gray-400">
                    {info.icon}
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{info.label}</p>
                  <p className="text-sm font-semibold text-white">{info.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Processing Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-300">Başlangıç</span>
              </div>
              <p className="text-xs text-blue-200">
                {new Date(transcription.created_at).toLocaleString('tr-TR')}
              </p>
            </div>
            
            {transcription.completed_at && (
              <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300">Tamamlanma</span>
                </div>
                <p className="text-xs text-green-200">
                  {new Date(transcription.completed_at).toLocaleString('tr-TR')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
