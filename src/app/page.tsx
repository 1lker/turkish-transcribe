'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain,
  Activity,
  Cpu,
  Globe,
  Github,
  Sparkles,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { HealthStatus, ModelSize } from '@/lib/types';
import { useTranscription } from '@/hooks/useTranscription';

import FileUploadCard from '@/components/FileUploadCard';
import ModelSelectionCard from '@/components/ModelSelectionCard';
import FileInfoCard from '@/components/FileInfoCard';
import TranscriptionResultCard from '@/components/TranscriptionResultCard';
import StatsCard from '@/components/StatsCard';
import YouTubeInput from '@/components/ui/YouTubeInput';

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelSize>('base');

  const {
    uploadState,
    transcriptionState,
    fileInfo,
    processFile,
    downloadResult,
    copyToClipboard,
    reset,
    isProcessing,
    isComplete,
  } = useTranscription({
    onSuccess: (result) => {
      console.log('Transcription successful:', result);
    },
    onError: (error) => {
      console.error('Transcription error:', error);
    },
  });

  // Check API health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const status = await api.health();
      setHealth(status);
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('API bağlantısı kurulamadı. API\'nin çalıştığından emin olun.');
    }
  };

  const handleFileSelect = async (file: File) => {
    await processFile(file, {
      model_size: selectedModel,
      language: 'tr',
      apply_vad: true,
      normalize_audio: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      
      {/* Content */}
      <div className="relative">
        {/* Modern Header */}
        <motion.header 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-50 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80"
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl blur opacity-75"></div>
                  <div className="relative p-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Turkish AI Transcription
                  </h1>
                  <p className="text-sm text-slate-400">Powered by OpenAI Whisper</p>
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="flex items-center gap-3">
                {health && (
                  <>
                    <Badge 
                      variant={health.status === 'healthy' ? 'default' : 'destructive'} 
                      className={`${health.status === 'healthy' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                      } backdrop-blur-sm`}
                    >
                      <Activity className="w-3 h-3" />
                      {health.status}
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-800/50 text-slate-300 border-slate-700/50 backdrop-blur-sm">
                      <Cpu className="w-3 h-3" />
                      {health.gpu_available ? 'GPU' : 'CPU'}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-800/30 text-slate-400 border-slate-600/50 backdrop-blur-sm">
                      <Globe className="w-3 h-3" />
                      v{health.version}
                    </Badge>
                  </>
                )}
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
                >
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {/* Stats Overview */}
          {isComplete && transcriptionState.result && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mb-8"
            >
              <StatsCard transcription={transcriptionState.result} />
            </motion.div>
          )}

          {/* Main Grid Layout */}
          <div className="grid xl:grid-cols-5 lg:grid-cols-3 gap-8">
            {/* Left Sidebar - Controls */}
            <div className="xl:col-span-2 lg:col-span-1 space-y-6">
              {/* Model Selection */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <ModelSelectionCard 
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={isProcessing}
                />
              </motion.div>

              {/* File Upload */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <FileUploadCard
                  onFileSelect={handleFileSelect}
                  isProcessing={isProcessing}
                  uploadProgress={uploadState.progress}
                />
              </motion.div>

              {/* YouTube Input */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <YouTubeInput
                  onDownloadComplete={async (result) => {
                    console.log('YouTube download complete:', result);
                    toast.success(`Downloaded: ${result.title}`);
                    
                    // Create a File object from the downloaded audio
                    try {
                      console.log('Fetching downloaded file:', result.filename);
                      const response = await fetch(`/api/download/${result.filename}`);
                      
                      console.log('Download response status:', response.status);
                      
                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Download response error:', errorText);
                        throw new Error(`HTTP ${response.status}: ${errorText}`);
                      }
                      
                      const blob = await response.blob();
                      console.log('Blob created, size:', blob.size);
                      
                      const file = new File([blob], result.filename, { type: 'audio/wav' });
                      console.log('File object created:', file.name, file.size);
                      
                      // Automatically start transcription
                      toast.info('Starting transcription for downloaded audio...');
                      await handleFileSelect(file);
                      
                      toast.success('Transcription process started successfully!');
                      
                    } catch (error) {
                      console.error('Failed to process downloaded file:', error);
                      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                      toast.error(`Downloaded successfully but failed to start transcription: ${errorMessage}`);
                    }
                  }}
                  onError={(error) => {
                    console.error('YouTube download error:', error);
                    toast.error(`Download failed: ${error}`);
                  }}
                />
              </motion.div>

              {/* File Info */}
              {fileInfo && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                >
                  <FileInfoCard fileInfo={fileInfo} />
                </motion.div>
              )}
            </div>

            {/* Right Content - Results */}
            <div className="xl:col-span-3 lg:col-span-2">
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <TranscriptionResultCard
                  transcriptionState={transcriptionState}
                  onDownload={downloadResult}
                  onCopy={copyToClipboard}
                  onReset={reset}
                />
              </motion.div>
            </div>
          </div>

          {/* Features Section */}
          <motion.section
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Güçlü AI Özellikleri
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                OpenAI Whisper teknolojisi ile Türkçe diline optimize edilmiş, 
                profesyonel transcription deneyimi
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="relative overflow-hidden border-slate-800/50 bg-slate-900/30 backdrop-blur-sm hover:bg-slate-900/50 transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur"></div>
                      <div className="relative p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20">
                        <Zap className="w-8 h-8 text-violet-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Hızlı İşlem</h3>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    GPU hızlandırması ve optimize edilmiş algoritmalar sayesinde 
                    ses dosyalarınız saniyeler içinde işlenir
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-slate-800/50 bg-slate-900/30 backdrop-blur-sm hover:bg-slate-900/50 transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur"></div>
                      <div className="relative p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <Brain className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Yüksek Doğruluk</h3>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    OpenAI Whisper modeli ile %95+ doğruluk oranında 
                    Türkçe transcription ve anlık çeviri
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-slate-800/50 bg-slate-900/30 backdrop-blur-sm hover:bg-slate-900/50 transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur"></div>
                      <div className="relative p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <Sparkles className="w-8 h-8 text-emerald-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-white">Akıllı Özellikler</h3>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Ses aktivite tespiti, otomatik normalizasyon ve 
                    çoklu format desteği ile profesyonel sonuçlar
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          {/* Footer */}
          <footer className="mt-20 pt-12 border-t border-slate-800/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-white">Turkish AI Transcription</span>
              </div>
              <p className="text-slate-400 mb-6">
                © 2024 Turkish AI Transcription • Modern web teknolojileri ile geliştirildi
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                <span>Next.js 14</span>
                <Separator orientation="vertical" className="h-4 bg-slate-700" />
                <span>OpenAI Whisper</span>
                <Separator orientation="vertical" className="h-4 bg-slate-700" />
                <span>TypeScript</span>
                <Separator orientation="vertical" className="h-4 bg-slate-700" />
                <span>Tailwind CSS</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}