import React, { useState, useEffect } from 'react';
import { Video, Loader2, Edit2 } from 'lucide-react';
import { Shot, AspectRatio, VideoDuration } from '../../types';
import { VideoSettingsPanel } from '../AspectRatioSelector';
import { resolveVideoModelRouting } from './utils';
import { 
  getDefaultAspectRatio, 
  getDefaultVideoDuration,
  getVideoModels,
  getActiveVideoModel,
  getProviderById,
} from '../../services/modelRegistry';
import { VideoModelDefinition } from '../../types/model';
import { useResolvedVideoUrl } from '../../hooks/useResolvedVideoUrl';

interface VideoGeneratorProps {
  shot: Shot;
  hasStartFrame: boolean;
  hasEndFrame: boolean;
  onGenerate: (aspectRatio: AspectRatio, duration: VideoDuration, modelId: string) => void;
  onEditPrompt: () => void;
  onModelChange?: (modelId: string) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({
  shot,
  hasStartFrame,
  hasEndFrame,
  onGenerate,
  onEditPrompt,
  onModelChange
}) => {
  const normalizeModelId = (modelId?: string) => {
    if (!modelId) return modelId;
    return modelId.toLowerCase() === 'veo_3_1-fast-4k' ? 'veo_3_1-fast' : modelId;
  };

  const resolveVeoFastQuality = (modelId?: string): 'standard' | '4k' => {
    if (!modelId) return 'standard';
    return modelId.toLowerCase() === 'veo_3_1-fast-4k' ? '4k' : 'standard';
  };

  // 获取可用的视频模型
  const videoModels = getVideoModels().filter(m => m.isEnabled);
  const defaultModel = getActiveVideoModel();
  
  // 状态（废弃模型已在数据加载层迁移，此处无需额外处理）
  const [selectedModelId, setSelectedModelId] = useState<string>(
    normalizeModelId(shot.videoModel) || defaultModel?.id || videoModels[0]?.id || 'sora-2'
  );
  const [veoFastQuality, setVeoFastQuality] = useState<'standard' | '4k'>(
    resolveVeoFastQuality(shot.videoModel)
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => getDefaultAspectRatio());
  const [duration, setDuration] = useState<VideoDuration>(() => getDefaultVideoDuration());
  
  // 当前选中的模型
  const selectedModel = videoModels.find(m => m.id === selectedModelId) as VideoModelDefinition | undefined;
  const selectedProvider = selectedModel ? getProviderById(selectedModel.providerId) : undefined;
  const requiresDedicatedApiKey = selectedModel?.providerId === 'volcengine';
  const hasDedicatedApiKey = Boolean(
    (selectedModel?.apiKey && selectedModel.apiKey.trim()) ||
    (selectedProvider?.apiKey && selectedProvider.apiKey.trim())
  );
  const isMissingVolcengineApiKey = Boolean(requiresDedicatedApiKey && !hasDedicatedApiKey);
  const modelType: 'sora' | 'veo' = selectedModel?.params.mode === 'async' ? 'sora' : 'veo';
  const effectiveModelId = selectedModelId === 'veo_3_1-fast'
    ? (veoFastQuality === '4k' ? 'veo_3_1-fast-4K' : 'veo_3_1-fast')
    : selectedModelId;
  const modelRouting = resolveVideoModelRouting(effectiveModelId || selectedModelId || 'sora-2');
  const routingLabel =
    modelRouting.family === 'sora'
      ? 'Sora'
      : modelRouting.family === 'doubao-task'
        ? 'Doubao Task'
      : modelRouting.family === 'veo-sync'
        ? 'Veo Sync'
        : modelRouting.family === 'veo-fast'
          ? 'Veo Fast'
          : 'Unknown';
  const getRecommendedModeLabel = (modelId: string): string => {
    const routing = resolveVideoModelRouting(modelId);
    if (routing.family === 'sora' || routing.family === 'doubao-task') {
      return 'Gợi ý: Grid Storyboard';
    }
    if (routing.family === 'veo-sync') {
      return 'Gợi ý: Đầu-cuối';
    }
    if (routing.family === 'veo-fast') {
      return 'Grid/Đầu-cuối';
    }
    return 'Theo phân cảnh';
  };
  
  const isGenerating = shot.interval?.status === 'generating';
  const hasVideo = !!shot.interval?.videoUrl;
  const resolvedVideoSrc = useResolvedVideoUrl(shot.interval?.videoUrl);

  // 当模型变化时，更新横竖屏和时长的默认值
  useEffect(() => {
    if (selectedModel) {
      // 如果当前选择的横竖屏不被新模型支持，切换到默认值
      if (!selectedModel.params.supportedAspectRatios.includes(aspectRatio)) {
        setAspectRatio(selectedModel.params.defaultAspectRatio);
      }
      // 如果当前选择的时长不被新模型支持，切换到默认值
      if (!selectedModel.params.supportedDurations.includes(duration)) {
        setDuration(selectedModel.params.defaultDuration);
      }
    }
  }, [selectedModelId]);

  useEffect(() => {
    if (!shot.videoModel) return;
    setSelectedModelId(normalizeModelId(shot.videoModel));
    setVeoFastQuality(resolveVeoFastQuality(shot.videoModel));
  }, [shot.videoModel]);

  const handleGenerate = () => {
    onGenerate(aspectRatio, duration, effectiveModelId);
  };

  const handleVeoFastQualityChange = (quality: 'standard' | '4k') => {
    setVeoFastQuality(quality);
    if (selectedModelId === 'veo_3_1-fast') {
      const modelId = quality === '4k' ? 'veo_3_1-fast-4K' : 'veo_3_1-fast';
      onModelChange?.(modelId);
    }
  };

  const canGenerate = hasStartFrame && !isMissingVolcengineApiKey;

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border-primary)] space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
          <Video className="w-3 h-3 text-[var(--accent)]" />
          Tạo Video
          <button 
            onClick={onEditPrompt}
            className="p-1 text-[var(--warning-text)] hover:text-[var(--text-primary)] transition-colors"
            title="Xem/Chỉnh sửa Prompt video"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </h4>
        {shot.interval?.status === 'completed' && (
          <span className="text-[10px] text-[var(--success)] font-mono flex items-center gap-1">
            ● READY
          </span>
        )}
      </div>
      
      {/* Model Selector */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest block">
          Chọn Model Video
        </label>
        <select
          value={selectedModelId}
          onChange={(e) => {
            const newModelId = e.target.value;
            setSelectedModelId(newModelId);
            const resolvedModelId = newModelId === 'veo_3_1-fast'
              ? (veoFastQuality === '4k' ? 'veo_3_1-fast-4K' : 'veo_3_1-fast')
              : newModelId;
            onModelChange?.(resolvedModelId);
          }}
          className="w-full bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-xs outline-none focus:border-[var(--accent)] transition-colors"
          disabled={isGenerating}
        >
          {videoModels.map((model) => {
            const vm = model as VideoModelDefinition;
            const modeLabel = vm.params.mode === 'async' ? 'Bất đồng bộ' : 'Đầu-cuối';
            const recommendationLabel = getRecommendedModeLabel(model.id);
            return (
              <option key={model.id} value={model.id}>
                {model.name} ({modeLabel} · {recommendationLabel})
              </option>
            );
          })}
        </select>
        {selectedModel && (
          <p className="text-[9px] text-[var(--text-muted)] font-mono">
            ✦ {selectedModel.name}: 
            {selectedModel.params.mode === 'async' 
              ? ` Hỗ trợ ${selectedModel.params.supportedAspectRatios.join('/')}, tùy chọn ${selectedModel.params.supportedDurations.join('/')}s`
              : ` Chế độ đầu-cuối, hỗ trợ ${selectedModel.params.supportedAspectRatios.join('/')}`
            }
            {` ｜${getRecommendedModeLabel(effectiveModelId || selectedModel.id)}`}
          </p>
        )}
        {isMissingVolcengineApiKey && (
          <div className="rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-2">
            <p className="text-[10px] text-[var(--error-text)] font-bold">
              Model hiện tại cần API Key riêng của Volcengine
            </p>
            <p className="text-[9px] text-[var(--error-text)]/90 mt-1">
              Không tìm thấy Key cho model này hoặc nhà cung cấp Volcengine. Model này sẽ không dùng Key toàn cục, vui lòng thiết lập trong cấu hình model trước khi tạo.
            </p>
          </div>
        )}
        <div className="bg-[var(--bg-base)] border border-[var(--border-secondary)] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
              Thẻ năng lực model
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
              {routingLabel}
            </span>
          </div>
          {[
            {
              key: 'start-only',
              label: 'Hỗ trợ khung hình đầu',
              enabled: modelRouting.supportsStartFrame,
            },
            {
              key: 'start-end',
              label: 'Hỗ trợ khung hình đầu-cuối',
              enabled: modelRouting.supportsStartFrame && modelRouting.supportsEndFrame,
            },
            {
              key: 'nine-grid-priority',
              label: 'Ưu tiên Grid Storyboard',
              enabled: modelRouting.prefersNineGridStoryboard,
            },
          ].map((capability) => (
            <div key={capability.key} className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--text-secondary)]">{capability.label}</span>
              <span
                className={`px-2 py-0.5 rounded border font-mono ${
                  capability.enabled
                    ? 'text-[var(--success)] border-[var(--success)]/40 bg-[var(--success)]/10'
                    : 'text-[var(--text-muted)] border-[var(--border-primary)] bg-[var(--bg-hover)]'
                }`}
              >
                {capability.enabled ? 'ON' : 'OFF'}
              </span>
            </div>
          ))}
          {hasEndFrame && !modelRouting.supportsEndFrame && (
            <p className="text-[9px] text-[var(--warning-text)] font-mono">
              Model hiện tại sẽ tự động bỏ qua khung hình cuối, chỉ sử dụng khung hình đầu để điều khiển.
            </p>
          )}
        </div>
        {selectedModelId === 'veo_3_1-fast' && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase">Chất lượng</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleVeoFastQualityChange('standard')}
                disabled={isGenerating}
                className={`
                  px-3 py-1.5 rounded-md text-xs transition-all
                  ${veoFastQuality === 'standard'
                    ? 'bg-[var(--accent)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:bg-[var(--border-secondary)] hover:text-[var(--text-secondary)]'
                  }
                  ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                Tiêu chuẩn
              </button>
              <button
                onClick={() => handleVeoFastQualityChange('4k')}
                disabled={isGenerating}
                className={`
                  px-3 py-1.5 rounded-md text-xs transition-all
                  ${veoFastQuality === '4k'
                    ? 'bg-[var(--accent)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:bg-[var(--border-secondary)] hover:text-[var(--text-secondary)]'
                  }
                  ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                4K
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 视频设置：横竖屏 & 时长 */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest block">
          Thiết lập video
        </label>
        <VideoSettingsPanel
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          duration={duration}
          onDurationChange={setDuration}
          modelType={modelType}
          disabled={isGenerating}
          supportedAspectRatios={selectedModel?.params.supportedAspectRatios}
          supportedDurations={selectedModel?.params.supportedDurations}
        />
      </div>
      
      {/* Video Preview */}
      {hasVideo ? (
        <div className="w-full aspect-video bg-[var(--bg-base)] rounded-lg overflow-hidden border border-[var(--border-secondary)] relative shadow-lg">
          <video src={resolvedVideoSrc} controls className="w-full h-full" />
        </div>
      ) : (
        <div className="w-full aspect-video bg-[var(--nav-hover-bg)] rounded-lg border border-dashed border-[var(--border-primary)] flex items-center justify-center">
          <span className="text-xs text-[var(--text-muted)] font-mono">VÙNG XEM TRƯỚC</span>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
        className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
          hasVideo 
            ? 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-secondary)]'
            : 'bg-[var(--accent)] text-[var(--text-primary)] hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent-shadow)]'
        } ${(!canGenerate) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {`Đang tạo video (${aspectRatio}, ${modelType === 'sora' ? `${duration}s` : selectedModel?.name})...`}
          </>
        ) : (
          <>{hasVideo ? 'Tạo lại video' : 'Bắt đầu tạo video'}</>
        )}
      </button>
      {isMissingVolcengineApiKey && (
        <div className="text-[9px] text-[var(--error-text)] text-center font-mono">
          * Vui lòng chọn và cấu hình API Key Volcengine (Key model hoặc Key nhà cung cấp)
        </div>
      )}
      
      {/* Status Messages */}
      {!hasEndFrame && (
        <div className="text-[9px] text-[var(--text-tertiary)] text-center font-mono">
          * Không phát hiện khung hình cuối, sẽ sử dụng chế độ tạo từ ảnh đơn (Image-to-Video)
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
