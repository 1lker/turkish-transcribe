'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  Zap, 
  Clock, 
  Target, 
  ChevronDown, 
  CheckCircle2,
  Sparkles,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModelSize } from '@/lib/types';

interface ModelSelectionCardProps {
  selectedModel: ModelSize;
  onModelChange: (model: ModelSize) => void;
  disabled?: boolean;
}

interface ModelConfig {
  name: string;
  description: string;
  speed: 'Çok Hızlı' | 'Hızlı' | 'Orta' | 'Yavaş' | 'Çok Yavaş';
  quality: 'Temel' | 'İyi' | 'Yüksek' | 'Çok Yüksek' | 'Mükemmel';
  size: string;
  icon: React.ReactNode;
  gradient: string;
  recommended?: boolean;
  vram?: string;
}

const MODEL_CONFIGS: Record<ModelSize, ModelConfig> = {
  tiny: {
    name: 'Tiny',
    description: 'En hızlı model, temel kalite',
    speed: 'Çok Hızlı',
    quality: 'Temel',
    size: '~39 MB',
    vram: '~1 GB',
    icon: <Zap className="w-4 h-4" />,
    gradient: 'from-green-500 to-emerald-500',
  },
  base: {
    name: 'Base',
    description: 'Hız ve kalite dengesi',
    speed: 'Hızlı',
    quality: 'İyi',
    size: '~74 MB',
    vram: '~1 GB',
    icon: <Target className="w-4 h-4" />,
    gradient: 'from-blue-500 to-cyan-500',
    recommended: true,
  },
  small: {
    name: 'Small',
    description: 'Daha iyi kalite, makul hız',
    speed: 'Orta',
    quality: 'Yüksek',
    size: '~244 MB',
    vram: '~2 GB',
    icon: <Activity className="w-4 h-4" />,
    gradient: 'from-purple-500 to-violet-500',
  },
  medium: {
    name: 'Medium',
    description: 'Yüksek kalite, daha yavaş',
    speed: 'Yavaş',
    quality: 'Çok Yüksek',
    size: '~769 MB',
    vram: '~5 GB',
    icon: <Sparkles className="w-4 h-4" />,
    gradient: 'from-orange-500 to-red-500',
  },
  large: {
    name: 'Large',
    description: 'En yüksek kalite, en yavaş',
    speed: 'Çok Yavaş',
    quality: 'Mükemmel',
    size: '~1550 MB',
    vram: '~10 GB',
    icon: <Cpu className="w-4 h-4" />,
    gradient: 'from-pink-500 to-rose-500',
  },
};

export default function ModelSelectionCard({ 
  selectedModel, 
  onModelChange, 
  disabled = false 
}: ModelSelectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<ModelSize | null>(null);

  const selectedConfig = MODEL_CONFIGS[selectedModel];

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'Çok Hızlı': return 'text-green-400';
      case 'Hızlı': return 'text-blue-400';
      case 'Orta': return 'text-yellow-400';
      case 'Yavaş': return 'text-orange-400';
      case 'Çok Yavaş': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Temel': return 'text-gray-400';
      case 'İyi': return 'text-blue-400';
      case 'Yüksek': return 'text-purple-400';
      case 'Çok Yüksek': return 'text-pink-400';
      case 'Mükemmel': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-violet-500" />
          Model Seçimi
        </CardTitle>
        <CardDescription>
          Hız ve kalite dengesine göre Whisper modeli seçin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Model Display */}
        <motion.div
          className={`
            relative p-4 rounded-xl border-2 cursor-pointer transition-all
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-600'}
            ${isExpanded ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-800/50'}
          `}
          onClick={() => !disabled && setIsExpanded(!isExpanded)}
          whileHover={!disabled ? { scale: 1.02 } : undefined}
          whileTap={!disabled ? { scale: 0.98 } : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${selectedConfig.gradient}`}>
                {selectedConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{selectedConfig.name}</span>
                  {selectedConfig.recommended && (
                    <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                      Önerilen
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-400">{selectedConfig.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className={getSpeedColor(selectedConfig.speed)}>
                    {selectedConfig.speed}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span className={getQualityColor(selectedConfig.quality)}>
                    {selectedConfig.quality}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Model Options */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {Object.entries(MODEL_CONFIGS).map(([modelKey, config]) => {
                const isSelected = modelKey === selectedModel;
                const isHovered = hoveredModel === modelKey;
                
                return (
                  <motion.div
                    key={modelKey}
                    className={`
                      relative p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-violet-500 bg-violet-500/20' 
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => {
                      if (!disabled) {
                        onModelChange(modelKey as ModelSize);
                        setIsExpanded(false);
                      }
                    }}
                    onHoverStart={() => setHoveredModel(modelKey as ModelSize)}
                    onHoverEnd={() => setHoveredModel(null)}
                    whileHover={!disabled ? { x: 4 } : undefined}
                    layout
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient} transition-transform ${isHovered ? 'scale-110' : ''}`}>
                          {config.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{config.name}</span>
                            {config.recommended && (
                              <Badge variant="outline" className="text-xs">
                                Önerilen
                              </Badge>
                            )}
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{config.description}</p>
                        </div>
                      </div>
                      
                      <div className="text-right text-xs space-y-1">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className={getSpeedColor(config.speed)}>
                              {config.speed}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span className={getQualityColor(config.quality)}>
                              {config.quality}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500">
                          <span>{config.size}</span>
                          <span>VRAM: {config.vram}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Performance Tips */}
        <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
          <h4 className="text-sm font-medium text-white mb-2">💡 İpuçları</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• <strong>Tiny/Base:</strong> Hızlı sonuçlar için ideal</li>
            <li>• <strong>Small/Medium:</strong> Daha iyi doğruluk oranı</li>
            <li>• <strong>Large:</strong> En yüksek kalite, daha uzun işlem süresi</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
