"use client";

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Youtube, 
  Download, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  ThumbsUp,
  User,
  Calendar,
  AudioLines,
  Globe,
  Settings,
  Zap
} from 'lucide-react';

interface YouTubeVideoInfo {
  video_id: string;
  title: string;
  duration?: number;
  description: string;
  uploader?: string;
  upload_date?: string;
  view_count?: number;
  like_count?: number;
  thumbnail?: string;
  has_audio: boolean;
  formats_count: number;
}

interface YouTubeFormat {
  format_id: string;
  ext: string;
  acodec?: string;
  abr?: number;
  asr?: number;
  filesize?: number;
  quality?: string;
  format_note: string;
}

interface DownloadProgress {
  status: string;
  percent?: string;
  speed?: string;
  eta?: string;
  filename?: string;
  message?: string;
}

interface DownloadResult {
  session_id: string;
  video_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  quality: string;
  duration?: number;
  title: string;
  uploader?: string;
}

interface YouTubeInputProps {
  onDownloadComplete?: (result: DownloadResult) => void;
  onError?: (error: string) => void;
}

const YouTubeInput: React.FC<YouTubeInputProps> = ({ 
  onDownloadComplete, 
  onError 
}) => {
  const { toast } = useToast();
  
  // State management
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [formats, setFormats] = useState<YouTubeFormat[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>('best');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  // URL validation
  const validateYouTubeUrl = useCallback((inputUrl: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(inputUrl);
  }, []);

  // Handle URL input change
  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setIsValidUrl(validateYouTubeUrl(value));
    
    // Reset states when URL changes
    if (videoInfo && value !== url) {
      setVideoInfo(null);
      setFormats([]);
      setDownloadResult(null);
    }
  }, [validateYouTubeUrl, videoInfo, url]);

  // Format duration helper
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size helper
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  // Format number helper
  const formatNumber = (num?: number): string => {
    if (!num) return '0';
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Get video information
  const getVideoInfo = async () => {
    if (!isValidUrl) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/youtube/info?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to get video information');
      }
      
      const info: YouTubeVideoInfo = await response.json();
      setVideoInfo(info);
      
      // Also get available formats
      const formatsResponse = await fetch(`/api/youtube/formats?url=${encodeURIComponent(url)}`);
      if (formatsResponse.ok) {
        const formatsData = await formatsResponse.json();
        setFormats(formatsData.formats || []);
      }
      
      toast({
        title: "Video Information Retrieved",
        description: `Found: ${info.title}`,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get video information';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup WebSocket connection for download progress
  const setupWebSocket = (sessionId: string) => {
    const wsUrl = `ws://localhost:8000/youtube/download/${sessionId}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected for session:', sessionId);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress_update') {
          setDownloadProgress(data);
        } else if (data.type === 'status_update') {
          setDownloadProgress(data);
          
          if (data.status === 'completed' && data.result) {
            setDownloadResult(data.result);
            setIsDownloading(false);
            onDownloadComplete?.(data.result);
            
            toast({
              title: "Download Complete",
              description: `Successfully downloaded: ${data.result.title}`,
            });
          } else if (data.status === 'failed') {
            setIsDownloading(false);
            const errorMessage = data.error || 'Download failed';
            toast({
              title: "Download Failed",
              description: errorMessage,
              variant: "destructive",
            });
            onError?.(errorMessage);
          }
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket closed for session:', sessionId);
    };
    
    setWebsocket(ws);
    return ws;
  };

  // Start download
  const startDownload = async () => {
    if (!videoInfo || !isValidUrl) return;
    
    setIsDownloading(true);
    setDownloadProgress(null);
    setDownloadResult(null);
    
    try {
      const response = await fetch('/api/youtube/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          quality: selectedQuality,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to start download');
      }
      
      const result = await response.json();
      setCurrentSessionId(result.session_id);
      
      // Setup WebSocket for progress updates
      setupWebSocket(result.session_id);
      
      toast({
        title: "Download Started",
        description: "Your video is being downloaded...",
      });
      
    } catch (error) {
      setIsDownloading(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start download';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      onError?.(errorMessage);
    }
  };

  // Cancel download
  const cancelDownload = async () => {
    if (!currentSessionId) return;
    
    try {
      await fetch(`/api/youtube/download/${currentSessionId}`, {
        method: 'DELETE',
      });
      
      if (websocket) {
        websocket.close();
        setWebsocket(null);
      }
      
      setIsDownloading(false);
      setDownloadProgress(null);
      setCurrentSessionId(null);
      
      toast({
        title: "Download Cancelled",
        description: "The download has been cancelled",
      });
      
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
          <div className="p-2 bg-red-500 rounded-lg">
            <Youtube className="h-5 w-5 text-white" />
          </div>
          YouTube Video Downloader
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* URL Input Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              YouTube URL
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  placeholder="Paste YouTube URL here... (e.g., https://www.youtube.com/watch?v=...)"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="h-12 text-base border-slate-300 dark:border-slate-600 pl-12 focus:ring-red-500 focus:border-red-500"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Youtube className="h-5 w-5 text-red-500" />
                </div>
                {isValidUrl && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              <Button 
                onClick={getVideoInfo}
                disabled={!isValidUrl || isLoading}
                className="h-12 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    <span className="hidden sm:inline">Get Info</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
          
          {url && !isValidUrl && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <XCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">
                Please enter a valid YouTube URL
              </p>
            </motion.div>
          )}
          
          {isValidUrl && !videoInfo && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Valid YouTube URL detected. Click &quot;Get Info&quot; to proceed.
              </p>
            </motion.div>
          )}
        </div>

        {/* Video Information */}
        <AnimatePresence>
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Video Info</TabsTrigger>
                  <TabsTrigger value="download">Download</TabsTrigger>
                  <TabsTrigger value="formats">Formats</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Thumbnail */}
                        {videoInfo.thumbnail && (
                          <div className="md:col-span-1">
                            <div className="relative overflow-hidden rounded-lg shadow-lg bg-slate-800/20">
                              <Image 
                                src={videoInfo.thumbnail} 
                                alt={videoInfo.title}
                                width={480}
                                height={270}
                                className="w-full h-auto object-cover transition-transform hover:scale-105"
                                unoptimized={true}
                              />
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-black/70 text-white border-0">
                                  {formatDuration(videoInfo.duration)}
                                </Badge>
                              </div>
                              {videoInfo.has_audio ? (
                                <div className="absolute bottom-2 left-2">
                                  <Badge className="bg-green-500/80 text-white border-0">
                                    <AudioLines className="h-3 w-3 mr-1" />
                                    Audio Available
                                  </Badge>
                                </div>
                              ) : (
                                <div className="absolute bottom-2 left-2">
                                  <Badge variant="destructive" className="bg-red-500/80 border-0">
                                    No Audio
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Video Details */}
                        <div className="md:col-span-2 space-y-4">
                          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                            {videoInfo.title}
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-500" />
                              <span>{videoInfo.uploader || 'Unknown'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-slate-500" />
                              <span>{formatDuration(videoInfo.duration)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-slate-500" />
                              <span>{formatNumber(videoInfo.view_count)} views</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <ThumbsUp className="h-4 w-4 text-slate-500" />
                              <span>{formatNumber(videoInfo.like_count)} likes</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-500" />
                              <span>{videoInfo.upload_date || 'Unknown'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <AudioLines className="h-4 w-4 text-slate-500" />
                              <Badge variant={videoInfo.has_audio ? "default" : "destructive"}>
                                {videoInfo.has_audio ? 'Has Audio' : 'No Audio'}
                              </Badge>
                            </div>
                          </div>
                          
                          {videoInfo.description && (
                            <div>
                              <h4 className="font-medium mb-2">Description</h4>
                              <ScrollArea className="h-20">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {videoInfo.description}
                                </p>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="download" className="space-y-4">
                  <Card>
                    <CardContent className="p-6 space-y-6">
                      {/* Quality Selection */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Audio Quality
                        </label>
                        <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="best">Best Quality (192kbps)</SelectItem>
                            <SelectItem value="high">High Quality (160kbps)</SelectItem>
                            <SelectItem value="medium">Medium Quality (128kbps)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Download Button */}
                      <div className="space-y-4">
                        {!isDownloading ? (
                          <Button 
                            onClick={startDownload}
                            disabled={!videoInfo.has_audio}
                            className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Download className="h-6 w-6 mr-3" />
                            Download Audio & Start Transcription
                          </Button>
                        ) : (
                          <Button 
                            onClick={cancelDownload}
                            variant="destructive"
                            className="w-full h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <XCircle className="h-6 w-6 mr-3" />
                            Cancel Download
                          </Button>
                        )}
                        
                        {!videoInfo.has_audio && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <XCircle className="h-5 w-5 text-red-500" />
                              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                This video doesn&apos;t contain audio and cannot be downloaded
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Download Progress */}
                      {downloadProgress && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="font-medium text-blue-700 dark:text-blue-300">
                                {downloadProgress.status === 'downloading' ? 'Downloading...' : 
                                 downloadProgress.status === 'processing' ? 'Processing...' : 
                                 downloadProgress.status}
                              </span>
                            </div>
                            {downloadProgress.percent && (
                              <Badge variant="secondary" className="font-mono">
                                {downloadProgress.percent}
                              </Badge>
                            )}
                          </div>
                          
                          {downloadProgress.percent && (
                            <div className="space-y-2">
                              <Progress 
                                value={parseInt(downloadProgress.percent.replace('%', ''))} 
                                className="h-3 bg-slate-200 dark:bg-slate-700"
                              />
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {downloadProgress.speed && (
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-blue-500" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  Speed: <span className="font-medium">{downloadProgress.speed}</span>
                                </span>
                              </div>
                            )}
                            {downloadProgress.eta && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  ETA: <span className="font-medium">{downloadProgress.eta}</span>
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {downloadProgress.message && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                              {downloadProgress.message}
                            </p>
                          )}
                        </motion.div>
                      )}
                      
                      {/* Download Result */}
                      {downloadResult && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-lg"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500 rounded-full">
                              <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-green-700 dark:text-green-300 text-lg">
                                Download Complete!
                              </h4>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Ready for transcription
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-slate-600 dark:text-slate-400 block mb-1">Filename:</span>
                              <p className="font-medium text-slate-800 dark:text-slate-200 break-all">
                                {downloadResult.filename}
                              </p>
                            </div>
                            <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-slate-600 dark:text-slate-400 block mb-1">File Size:</span>
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {formatFileSize(downloadResult.file_size)}
                              </p>
                            </div>
                            <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-slate-600 dark:text-slate-400 block mb-1">Quality:</span>
                              <p className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                                {downloadResult.quality}
                              </p>
                            </div>
                            <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                              <span className="text-slate-600 dark:text-slate-400 block mb-1">Duration:</span>
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {formatDuration(downloadResult.duration)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                              🎉 Your audio has been downloaded and transcription will start automatically!
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="formats" className="space-y-4">
                  <Card>
                    <CardContent className="p-6">
                      <h4 className="font-medium mb-4">Available Audio Formats</h4>
                      <ScrollArea className="h-60">
                        <div className="space-y-2">
                          {formats.map((format, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{format.ext}</span>
                                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                                    {format.acodec}
                                  </span>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400">
                                  {format.abr && `${format.abr}kbps`}
                                  {format.asr && ` • ${format.asr}Hz`}
                                </div>
                              </div>
                              {format.format_note && (
                                <p className="text-xs text-slate-500 mt-1">{format.format_note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default YouTubeInput;
