'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Copy, 
  Check, 
  RotateCcw, 
  Loader2, 
  AlertCircle, 
  Clock, 
  FileDown,
  ScrollText,
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { TranscriptionState } from '@/lib/types';

interface TranscriptionResultCardProps {
  transcriptionState: TranscriptionState;
  onDownload: (format: string) => void;
  onCopy: () => void;
  onReset: () => void;
}

export default function TranscriptionResultCard({ 
  transcriptionState, 
  onDownload, 
  onCopy, 
  onReset 
}: TranscriptionResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('text');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());

  const { status, progress, result, error } = transcriptionState;

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-500/30 text-yellow-300 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  const filteredSegments = result?.segments?.filter(segment =>
    !searchTerm || segment.text.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const toggleSegmentExpansion = (segmentId: number) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(segmentId)) {
      newExpanded.delete(segmentId);
    } else {
      newExpanded.add(segmentId);
    }
    setExpandedSegments(newExpanded);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <Check className="w-5 h-5" />;
      case 'processing': return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'failed': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const downloadFormats = [
    { id: 'txt', label: 'Metin (.txt)', icon: <FileText className="w-4 h-4" /> },
    { id: 'srt', label: 'Altyazı (.srt)', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'json', label: 'JSON (.json)', icon: <FileDown className="w-4 h-4" /> },
  ];

  return (
    <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-sm h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className={getStatusColor()}>
                {getStatusIcon()}
              </div>
              Transcription Sonucu
            </CardTitle>
            <CardDescription>
              {status === 'processing' && 'Ses dosyanız işleniyor...'}
              {status === 'completed' && 'Transcription tamamlandı!'}
              {status === 'failed' && 'İşlem başarısız oldu'}
              {status === 'pending' && 'İşlem başlamayı bekliyor...'}
            </CardDescription>
          </div>
          
          {status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Yeniden Başlat
            </Button>
          )}
        </div>
        
        {status === 'processing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">İlerleme</span>
              <span className="text-blue-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {status === 'pending' && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-2">Hazır</h3>
                  <p className="text-sm text-slate-400">
                    Bir dosya seçin ve transcription başlatın
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-2">İşleniyor...</h3>
                  <p className="text-sm text-gray-400">
                    Ses dosyanız analiz ediliyor ve metne dönüştürülüyor
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h3 className="font-medium text-red-400 mb-2">İşlem Başarısız</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {error || 'Bilinmeyen bir hata oluştu'}
                  </p>
                  <Button variant="outline" onClick={onReset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tekrar Dene
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {status === 'completed' && result && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col min-h-0 space-y-4"
            >
              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="text-green-400 hover:text-green-300"
                  >
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Kopyalandı!' : 'Kopyala'}
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {downloadFormats.map((format) => (
                      <Button
                        key={format.id}
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(format.id)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {format.icon}
                        <span className="ml-2 hidden sm:inline">{format.label.split(' ')[0]}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTimestamps(!showTimestamps)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showTimestamps ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Search */}
              {result.segments && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Metinde ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800/50 border-gray-700"
                  />
                </div>
              )}

              {/* Content Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                  <TabsTrigger value="text">Tam Metin</TabsTrigger>
                  <TabsTrigger value="segments">Segmentler</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="flex-1 mt-4">
                  <ScrollArea className="h-full bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                    <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                      {highlightSearchTerm(result.text || '')}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="segments" className="flex-1 mt-4">
                  <ScrollArea className="h-full space-y-2">
                    {filteredSegments.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        {searchTerm ? 'Arama kriterine uygun sonuç bulunamadı' : 'Segment bulunamadı'}
                      </div>
                    ) : (
                      filteredSegments.map((segment) => (
                        <motion.div
                          key={segment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: segment.id * 0.05 }}
                          className="bg-gray-800/30 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {showTimestamps && (
                              <div className="flex-shrink-0">
                                <Badge variant="outline" className="text-xs">
                                  {formatDuration(segment.start)}
                                </Badge>
                              </div>
                            )}
                            <div className="flex-1 text-gray-200">
                              {highlightSearchTerm(segment.text)}
                            </div>
                            {segment.no_speech_prob !== undefined && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSegmentExpansion(segment.id)}
                                className="p-1 h-auto"
                              >
                                {expandedSegments.has(segment.id) ? 
                                  <ChevronUp className="w-4 h-4" /> : 
                                  <ChevronDown className="w-4 h-4" />
                                }
                              </Button>
                            )}
                          </div>
                          
                          <AnimatePresence>
                            {expandedSegments.has(segment.id) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400 space-y-1"
                              >
                                <div>Süre: {formatDuration(segment.start)} - {formatDuration(segment.end)}</div>
                                {segment.no_speech_prob !== undefined && (
                                  <div>Sessizlik Oranı: {(segment.no_speech_prob * 100).toFixed(1)}%</div>
                                )}
                                {segment.avg_logprob !== undefined && (
                                  <div>Güven: {((1 + segment.avg_logprob) * 100).toFixed(1)}%</div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
