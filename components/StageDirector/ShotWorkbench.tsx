import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Film,
  Edit2,
  MessageSquare,
  Sparkles,
  Loader2,
  Scissors,
  Grid3x3,
  CircleHelp,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Shot,
  ProjectState,
  AspectRatio,
  VideoDuration,
  NineGridData,
  NineGridPanel,
  StoryboardGridPanelCount,
} from '../../types';
import SceneContext from './SceneContext';
import KeyframeEditor from './KeyframeEditor';
import VideoGenerator from './VideoGenerator';
import { resolveVideoModelRouting } from './utils';
import { getModelById } from '../../services/modelRegistry';
import {
  STORYBOARD_GRID_LAYOUTS,
  resolveStoryboardGridLayout,
} from './constants';

interface ShotWorkbenchProps {
  shot: Shot;
  shotIndex: number;
  totalShots: number;
  scriptData?: ProjectState['scriptData'];
  currentVideoModelId: string;
  nextShotHasStartFrame?: boolean;
  isAIOptimizing?: boolean;
  isAIReassessing?: boolean;
  isSplittingShot?: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onAIReassessQuality: () => void;
  onEditActionSummary: () => void;
  onEditDialogue: () => void;
  onGenerateAIAction: () => void;
  onSplitShot: () => void;
  onAddCharacter: (charId: string) => void;
  onRemoveCharacter: (charId: string) => void;
  onVariationChange: (charId: string, varId: string) => void;
  onSceneChange: (sceneId: string) => void;
  onAddProp?: (propId: string) => void;
  onRemoveProp?: (propId: string) => void;
  onGenerateKeyframe: (type: 'start' | 'end') => void;
  onUploadKeyframe: (type: 'start' | 'end') => void;
  onEditKeyframePrompt: (type: 'start' | 'end', prompt: string) => void;
  onOptimizeKeyframeWithAI: (type: 'start' | 'end') => void;
  onOptimizeBothKeyframes: () => void;
  onCopyPreviousEndFrame: () => void;
  onCopyNextStartFrame: () => void;
  useAIEnhancement: boolean;
  onToggleAIEnhancement: () => void;
  onGenerateVideo: (aspectRatio: AspectRatio, duration: VideoDuration, modelId: string) => void;
  onEditVideoPrompt: () => void;
  onVideoModelChange: (modelId: string) => void;
  onImageClick: (url: string, title: string) => void;
  videoInputMode?: 'keyframes' | 'storyboard-grid';
  onVideoInputModeChange: (mode: 'keyframes' | 'storyboard-grid') => void;
  onGenerateNineGrid: (panelCount?: StoryboardGridPanelCount) => void;
  nineGrid?: NineGridData;
  onSelectNineGridPanel: (panel: NineGridPanel) => void;
  onShowNineGrid: () => void;
}

type SectionKey = 'quality' | 'context' | 'keyframe' | 'narrative' | 'video' | 'advanced';

const ShotWorkbench: React.FC<ShotWorkbenchProps> = ({
  shot,
  shotIndex,
  totalShots,
  scriptData,
  currentVideoModelId,
  nextShotHasStartFrame = false,
  isAIOptimizing = false,
  isAIReassessing = false,
  isSplittingShot = false,
  onClose,
  onPrevious,
  onNext,
  onAIReassessQuality,
  onEditActionSummary,
  onEditDialogue,
  onGenerateAIAction,
  onSplitShot,
  onAddCharacter,
  onRemoveCharacter,
  onVariationChange,
  onSceneChange,
  onAddProp,
  onRemoveProp,
  onGenerateKeyframe,
  onUploadKeyframe,
  onEditKeyframePrompt,
  onOptimizeKeyframeWithAI,
  onOptimizeBothKeyframes,
  onCopyPreviousEndFrame,
  onCopyNextStartFrame,
  useAIEnhancement,
  onToggleAIEnhancement,
  onGenerateVideo,
  onEditVideoPrompt,
  onVideoModelChange,
  onImageClick,
  videoInputMode,
  onVideoInputModeChange,
  onGenerateNineGrid,
  nineGrid,
  onSelectNineGridPanel,
  onShowNineGrid,
}) => {
  const scene = scriptData?.scenes.find((s) => String(s.id) === String(shot.sceneId));
  const activeCharacters = scriptData?.characters.filter((c) => shot.characters.includes(c.id)) || [];
  const availableCharacters = scriptData?.characters.filter((c) => !shot.characters.includes(c.id)) || [];
  const activeProps = (scriptData?.props || []).filter((p) => (shot.props || []).includes(p.id));
  const availablePropsForShot = (scriptData?.props || []).filter((p) => !(shot.props || []).includes(p.id));

  const startKf = shot.keyframes?.find((k) => k.type === 'start');
  const endKf = shot.keyframes?.find((k) => k.type === 'end');
  const quality = shot.qualityAssessment;
  const [localVideoModelId, setLocalVideoModelId] = useState(currentVideoModelId);
  const [expandedCheckKey, setExpandedCheckKey] = useState<string | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<SectionKey[]>(['context']);
  const lastAutoExpandedShotRef = useRef<string | null>(null);

  const isSectionOpen = (sectionKey: SectionKey) => expandedSections.includes(sectionKey);
  const openSection = (sectionKey: SectionKey) => {
    setExpandedSections((prev) => (prev.includes(sectionKey) ? prev : [...prev, sectionKey]));
  };
  const toggleSection = (sectionKey: SectionKey) => {
    setExpandedSections((prev) =>
      prev.includes(sectionKey) ? prev.filter((item) => item !== sectionKey) : [...prev, sectionKey]
    );
  };

  useEffect(() => {
    setLocalVideoModelId(currentVideoModelId);
  }, [currentVideoModelId]);

  const modelRouting = resolveVideoModelRouting(localVideoModelId || currentVideoModelId || 'sora-2');
  const recommendedInputMode: 'keyframes' | 'storyboard-grid' =
    modelRouting.family === 'sora' || modelRouting.family === 'doubao-task'
      ? 'storyboard-grid'
      : 'keyframes';
  const effectiveVideoInputMode = videoInputMode || recommendedInputMode;
  const resolveStoredGridPanelCount = (): StoryboardGridPanelCount | null => {
    const fromLayout = nineGrid?.layout?.panelCount;
    if (fromLayout === 4 || fromLayout === 6 || fromLayout === 9) {
      return fromLayout;
    }

    const panelLength = nineGrid?.panels?.length;
    if (panelLength === 4 || panelLength === 6 || panelLength === 9) {
      return panelLength;
    }

    return null;
  };
  const resolveDefaultGridPanelCount = (): StoryboardGridPanelCount => {
    const intervalDuration = Number(shot.interval?.duration);
    if (Number.isFinite(intervalDuration) && intervalDuration === 8) {
      return 6;
    }

    const modelId = localVideoModelId || currentVideoModelId || shot.videoModel || 'sora-2';
    const model = getModelById(modelId) as any;
    const modelDefaultDuration = Number(model?.params?.defaultDuration);
    if (Number.isFinite(modelDefaultDuration) && modelDefaultDuration === 8) {
      return 6;
    }

    return 9;
  };
  const resolvePreferredGridPanelCount = (): StoryboardGridPanelCount =>
    resolveStoredGridPanelCount() ?? resolveDefaultGridPanelCount();
  const [selectedGridPanelCount, setSelectedGridPanelCount] = useState<StoryboardGridPanelCount>(() =>
    resolvePreferredGridPanelCount()
  );
  const selectedGridLayout = resolveStoryboardGridLayout(selectedGridPanelCount);
  const existingGridLayout = resolveStoryboardGridLayout(
    nineGrid?.layout?.panelCount,
    nineGrid?.panels?.length
  );
  const hasSameGridLayout =
    !!nineGrid?.panels?.length && existingGridLayout.panelCount === selectedGridLayout.panelCount;

  useEffect(() => {
    setSelectedGridPanelCount(resolvePreferredGridPanelCount());
  }, [shot.id, nineGrid?.layout?.panelCount, nineGrid?.panels?.length]);

  const showEndFrame = modelRouting.supportsEndFrame;
  const hasStartFrame = !!startKf?.imageUrl;
  const hasEndFrame = !!endKf?.imageUrl;
  const keyframeReady = effectiveVideoInputMode === 'storyboard-grid'
    ? hasStartFrame
    : hasStartFrame && (!showEndFrame || hasEndFrame);
  const hasActionSummary = (shot.actionSummary || '').trim().length > 0;
  const hasVideo = !!shot.interval?.videoUrl;
  const isVideoGenerating = shot.interval?.status === 'generating';

  useEffect(() => {
    if (lastAutoExpandedShotRef.current === shot.id) {
      return;
    }
    lastAutoExpandedShotRef.current = shot.id;

    if (!hasActionSummary) {
      openSection('narrative');
      return;
    }
    if (!keyframeReady) {
      openSection('keyframe');
      return;
    }
    if (!hasVideo) {
      openSection('video');
      return;
    }
    openSection('quality');
  }, [shot.id, hasActionSummary, keyframeReady, hasVideo]);

  useEffect(() => {
    setExpandedCheckKey(null);
  }, [shot.id]);

  useEffect(() => {
    if (effectiveVideoInputMode === 'storyboard-grid') {
      setIsAdvancedMode(true);
    }
  }, [effectiveVideoInputMode]);

  const qualityGradeLabel = quality?.grade === 'pass' ? 'Đạt' : quality?.grade === 'warning' ? 'Cần tối ưu' : 'Rủi ro cao';
  const qualityBadgeClass =
    quality?.grade === 'pass'
      ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
      : quality?.grade === 'warning'
        ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
        : 'bg-[var(--error-hover-bg)] text-[var(--error-text)] border-[var(--error-border)]';
  const qualitySourceLabel = quality ? (quality.version >= 2 ? 'Đánh giá AI V2' : 'Chấm điểm quy tắc V1') : '';

  const checkLabelMap: Record<string, string> = {
    'prompt-readiness': 'Độ hoàn thiện Prompt',
    'asset-coverage': 'Độ bao phủ tài nguyên',
    'keyframe-execution': 'Độ sẵn sàng khung hình',
    'video-execution': 'Trạng thái thực thi video',
    'continuity-risk': 'Rủi ro tính liên tục',
  };

  const adviceMap: Record<string, string> = {
    'prompt-readiness': 'Nên hoàn thiện Prompt cho khung hình đầu/cuối/video để tránh sai lệch.',
    'asset-coverage': 'Nên bổ sung ảnh tham khảo nhân vật/bối cảnh/đạo cụ để tăng tính nhất quán.',
    'keyframe-execution': 'Nên hoàn thành việc tạo khung hình chính trước khi tạo video.',
    'video-execution': 'Nên ưu tiên hoàn thành tạo video và xác nhận kết quả có thể phát.',
    'continuity-risk': 'Nên bổ sung các điểm neo đầu cuối để đảm bảo tính liên tục giữa các cảnh.',
  };

  const getCheckLabel = (checkKey: string, fallback: string) => checkLabelMap[checkKey] || fallback;

  const qualitySummary = (() => {
    if (!quality) return '';
    const failedLabels = quality.checks.filter((check) => !check.passed).map((check) => getCheckLabel(check.key, check.label));
    if (failedLabels.length === 0) return 'Có thể bắt đầu sản xuất, các hạng mục chính đã đạt.';
    if (quality.grade === 'fail') return `Rủi ro cao: ${failedLabels.join(', ')}`;
    if (quality.grade === 'warning') return `Cần tối ưu: ${failedLabels.join(', ')}`;
    return `Vấn đề nhỏ: ${failedLabels.join(', ')}`;
  })();

  const weakestCheck = quality?.checks?.length
    ? [...quality.checks].sort((a, b) => a.score - b.score)[0]
    : undefined;
  const qualityActionHint = weakestCheck ? adviceMap[weakestCheck.key] || '' : '';

  const steps = useMemo(
    () => [
      { key: 'context' as const, label: '1 Liên kết tài nguyên', done: !!scene && activeCharacters.length > 0 },
      { key: 'narrative' as const, label: '2 Hành động & Lời thoại', done: hasActionSummary },
      { key: 'keyframe' as const, label: effectiveVideoInputMode === 'storyboard-grid' ? '3 Grid Storyboard' : '3 Khung hình chính', done: keyframeReady },
      { key: 'video' as const, label: '4 Tạo video', done: hasVideo },
    ],
    [scene, activeCharacters.length, keyframeReady, hasActionSummary, hasVideo, effectiveVideoInputMode]
  );
  const completedSteps = steps.filter((item) => item.done).length;
  const recommendationText =
    modelRouting.family === 'sora' || modelRouting.family === 'doubao-task'
      ? 'Gợi ý: Grid Storyboard'
      : modelRouting.family === 'veo-sync'
        ? 'Gợi ý: Khung hình đầu-cuối'
        : 'Hỗ trợ Grid và Khung hình chính';
  const isGridGenerating = nineGrid?.status === 'generating_panels' || nineGrid?.status === 'generating_image';
  const openOrGenerateGridStoryboard = () => {
    if (
      hasSameGridLayout &&
      (nineGrid?.status === 'completed' || nineGrid?.status === 'panels_ready' || nineGrid?.status === 'generating_image')
    ) {
      onShowNineGrid();
      return;
    }
    onGenerateNineGrid(selectedGridPanelCount);
  };

  const primaryAction = useMemo(() => {
    if (!hasActionSummary) {
      return {
        label: 'Tiếp theo: Hoàn thiện hành động & lời thoại',
        hint: 'Khung hình chính và Grid phụ thuộc vào mô tả hành động, nên bổ sung trước.',
        disabled: false,
        onClick: () => openSection('narrative'),
      };
    }

    if (effectiveVideoInputMode === 'storyboard-grid' && !hasStartFrame) {
      return {
        label: 'Tiếp theo: Tạo Grid Storyboard',
        hint: isAdvancedMode
          ? `Tạo ${selectedGridLayout.label} và chọn khung hình đầu trước khi tạo video.`
          : 'Grid Storyboard là tính năng nâng cao, vui lòng chuyển sang "Nâng cao".',
        disabled: isGridGenerating,
        onClick: () => {
          openSection('keyframe');
          if (!isAdvancedMode) {
            setIsAdvancedMode(true);
            return;
          }
          openOrGenerateGridStoryboard();
        },
      };
    }

    if (!hasStartFrame) {
      return {
        label: 'Tiếp theo: Tạo khung hình đầu',
        hint: 'Tạo khung hình đầu trước để thiết lập điểm neo thị giác.',
        disabled: startKf?.status === 'generating',
        onClick: () => {
          openSection('keyframe');
          onGenerateKeyframe('start');
        },
      };
    }

    if (effectiveVideoInputMode === 'keyframes' && showEndFrame && !hasEndFrame) {
      return {
        label: 'Tiếp theo: Tạo khung hình cuối',
        hint: 'Hoàn thiện khung hình đầu-cuối sẽ giúp video ổn định hơn.',
        disabled: endKf?.status === 'generating',
        onClick: () => {
          openSection('keyframe');
          onGenerateKeyframe('end');
        },
      };
    }

    if (!hasVideo) {
      return {
        label: isVideoGenerating ? 'Đang tạo video...' : 'Tiếp theo: Bắt đầu tạo video',
        hint: isVideoGenerating ? 'Cảnh hiện tại đang được xử lý, vui lòng đợi.' : 'Chọn model và tham số ở bước 4 để tạo video.',
        disabled: isVideoGenerating,
        onClick: () => openSection('video'),
      };
    }

    return {
      label: isAIReassessing ? 'Đang đánh giá AI...' : 'Tiếp theo: Tái đánh giá AI',
      hint: 'Video đã hoàn thành, nên thực hiện đánh giá khả năng bàn giao cuối cùng.',
      disabled: isAIReassessing,
      onClick: () => {
        openSection('quality');
        onAIReassessQuality();
      },
    };
  }, [
    hasActionSummary,
    effectiveVideoInputMode,
    hasStartFrame,
    isAdvancedMode,
    selectedGridLayout.label,
    selectedGridPanelCount,
    isGridGenerating,
    openOrGenerateGridStoryboard,
    startKf?.status,
    showEndFrame,
    hasEndFrame,
    endKf?.status,
    hasVideo,
    isVideoGenerating,
    isAIReassessing,
    onGenerateKeyframe,
    onAIReassessQuality,
  ]);

  const getShotDisplayNumber = () => {
    const idParts = shot.id.split('-').slice(1);
    if (idParts.length === 1) return String(idParts[0]).padStart(2, '0');
    if (idParts.length === 2) return `${String(idParts[0]).padStart(2, '0')}-${idParts[1]}`;
    return String(shotIndex + 1).padStart(2, '0');
  };

  const renderSectionHeader = (
    sectionKey: SectionKey,
    title: string,
    subtitle: string,
    done?: boolean
  ) => {
    const isOpen = isSectionOpen(sectionKey);
    return (
      <button
        type="button"
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {done === undefined ? null : done ? (
            <CheckCircle2 className="w-4 h-4 text-[var(--success-text)] shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">{title}</p>
            <p className="text-[10px] text-[var(--text-muted)] truncate">{subtitle}</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
        )}
      </button>
    );
  };

  return (
    <div className="w-[500px] bg-[var(--bg-deep)] flex flex-col h-full shadow-2xl animate-in slide-in-from-right-10 duration-300 relative z-20">
      <div className="h-16 px-6 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
          <span className="min-w-[3rem] h-8 px-2 bg-[var(--accent-bg)] text-[var(--accent-text)] rounded-lg flex items-center justify-center font-bold font-mono text-[11px] whitespace-nowrap border border-[var(--accent-border)] shrink-0">
            {getShotDisplayNumber()}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[var(--text-primary)] font-bold text-sm">Chi tiết phân cảnh</h3>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest truncate" title={shot.cameraMovement}>
              {shot.cameraMovement}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center rounded-md border border-[var(--border-primary)] bg-[var(--bg-base)]/40 mr-2">
            <button
              type="button"
              className={`px-2 py-1 text-[10px] font-medium ${!isAdvancedMode ? 'text-[var(--text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--text-tertiary)]'}`}
              onClick={() => setIsAdvancedMode(false)}
              title="Chỉ hiển thị quy trình cốt lõi, giảm độ phức tạp"
            >
              Cơ bản
            </button>
            <button
              type="button"
              className={`px-2 py-1 text-[10px] font-medium ${isAdvancedMode ? 'text-[var(--text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--text-tertiary)]'}`}
              onClick={() => setIsAdvancedMode(true)}
              title="Hiển thị Grid Storyboard, tách cảnh và các công cụ nâng cao"
            >
              Nâng cao
            </button>
          </div>
          <button
            onClick={onPrevious}
            disabled={shotIndex === 0}
            className="p-2 hover:bg-[var(--bg-hover)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            disabled={shotIndex === totalShots - 1}
            className="p-2 hover:bg-[var(--bg-hover)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[var(--border-secondary)] mx-2" />
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--error-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--error-text)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden">
          {renderSectionHeader('quality', 'Đánh giá chất lượng', 'Xem khả năng bàn giao của phân cảnh hiện tại')}
          {isSectionOpen('quality') && quality && (
            <div className="px-4 pb-4 border-t border-[var(--border-primary)] space-y-2">
              <div className="pt-3 flex items-center justify-between gap-2">
                <span className={`px-2 py-1 rounded-md text-[10px] font-mono border ${qualityBadgeClass}`}>
                  Điểm {quality.score} · {qualityGradeLabel}
                </span>
                <button
                  type="button"
                  onClick={onAIReassessQuality}
                  disabled={isAIReassessing}
                  className="px-2 py-1 rounded-md text-[10px] font-semibold border border-[var(--accent-border)] text-[var(--accent-text)] hover:bg-[var(--accent-bg)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                  title="Dùng AI để đánh giá lại chất lượng phân cảnh hiện tại"
                >
                  {isAIReassessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isAIReassessing ? '评估中...' : 'AI重评估'}
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">{qualitySummary}</p>
              {qualityActionHint && (
                <p className="text-[10px] text-[var(--accent-text)] bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded px-2 py-1.5">
                  Gợi ý tiếp theo: {qualityActionHint}
                </p>
              )}
              <p className="text-[10px] text-[var(--text-muted)]">
                Nguồn: {qualitySourceLabel} · Thời gian: {new Date(quality.generatedAt).toLocaleString()}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Lưu ý: Đây là tổng điểm và cấp độ. Nhấn vào biểu tượng ? bên phải mỗi mục để xem chi tiết căn cứ đánh giá.</p>
              <div className="space-y-1.5">
                {quality.checks.map((check) => (
                  <div key={check.key} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-16 text-[10px] font-mono ${check.passed ? 'text-[var(--success-text)]' : 'text-[var(--warning-text)]'}`}>
                        {check.score}/100
                      </span>
                      <span className="flex-1 text-[11px] text-[var(--text-tertiary)] truncate" title={check.details || check.label}>
                        {getCheckLabel(check.key, check.label)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedCheckKey((prev) => (prev === check.key ? null : check.key))}
                        className="p-1 rounded border border-[var(--border-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-border)]"
                        title="Xem căn cứ đánh giá"
                      >
                        <CircleHelp className="w-3 h-3" />
                      </button>
                    </div>
                    {expandedCheckKey === check.key && (
                      <div className="ml-16 rounded border border-[var(--border-primary)] bg-[var(--bg-base)]/60 px-2 py-1.5 text-[10px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                        {check.details || 'Chưa có chi tiết đánh giá.'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {isSectionOpen('quality') && !quality && (
            <div className="px-4 pb-4 border-t border-[var(--border-primary)]">
              <p className="pt-3 text-xs text-[var(--text-muted)]">Phân cảnh này chưa có kết quả đánh giá chất lượng.</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Tiến độ quy trình</p>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">
              {completedSteps}/{steps.length} Hoàn thành
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {steps.map((step) => (
              <button
                key={step.key}
                type="button"
                onClick={() => openSection(step.key)}
                className={`px-2 py-1.5 rounded border text-[10px] text-left flex items-center gap-1.5 ${
                  isSectionOpen(step.key)
                    ? 'border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]'
                    : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                <span className="truncate">{step.label}</span>
              </button>
            ))}
          </div>
          {!isAdvancedMode && (
            <p className="text-[10px] text-[var(--text-muted)]">
              Đang ở chế độ Cơ bản. Khi cần tách cảnh/Grid Storyboard, có thể chuyển sang "Nâng cao" ở phía trên.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden">
          {renderSectionHeader('context', 'Liên kết tài nguyên', 'Xác nhận bối cảnh, nhân vật và đạo cụ', steps[0]?.done)}
          {isSectionOpen('context') && (
            <div className="border-t border-[var(--border-primary)] p-3">
              {scriptData ? (
                <SceneContext
                  shot={shot}
                  scene={scene}
                  scenes={scriptData.scenes}
                  characters={activeCharacters}
                  availableCharacters={availableCharacters}
                  props={activeProps}
                  availableProps={availablePropsForShot}
                  onAddCharacter={onAddCharacter}
                  onRemoveCharacter={onRemoveCharacter}
                  onVariationChange={onVariationChange}
                  onSceneChange={onSceneChange}
                  onAddProp={onAddProp}
                  onRemoveProp={onRemoveProp}
                />
              ) : (
                <p className="text-xs text-[var(--text-muted)]">Chưa có dữ liệu tài nguyên kịch bản.</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden">
          {renderSectionHeader('narrative', 'Hành động & Lời thoại', 'Xác định hành động kể chuyện trước khi tạo phân cảnh', steps[1]?.done)}
          {isSectionOpen('narrative') && (
            <div className="border-t border-[var(--border-primary)] p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-[var(--border-primary)] pb-2">
                <Film className="w-4 h-4 text-[var(--text-tertiary)]" />
                <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Narrative</h4>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={onGenerateAIAction}
                    disabled={isAIOptimizing}
                    className="p-1 text-[var(--accent-text)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="AI tạo gợi ý hành động"
                  >
                    {isAIOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={onEditActionSummary}
                    className="p-1 text-[var(--warning-text)] hover:text-[var(--text-primary)] transition-colors"
                    title="Chỉnh sửa văn bản hành động"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={onEditDialogue}
                    className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Chỉnh sửa lời thoại"
                  >
                    <MessageSquare className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar">
                <div className="bg-[var(--bg-base)] p-4 rounded-lg border border-[var(--border-primary)]">
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{shot.actionSummary || 'Chưa có mô tả hành động.'}</p>
                </div>
                <div className="bg-[var(--bg-base)] p-4 rounded-lg border border-[var(--border-primary)] flex gap-3">
                  <MessageSquare className="w-4 h-4 text-[var(--text-muted)] mt-0.5" />
                  <div className="flex-1">
                    {shot.dialogue ? (
                      <p className="text-[var(--text-tertiary)] text-xs italic leading-relaxed">"{shot.dialogue}"</p>
                    ) : (
                      <p className="text-[var(--text-muted)] text-xs leading-relaxed">Chưa có lời thoại, nhấn vào icon bong bóng thoại ở trên để thêm.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden">
          {renderSectionHeader(
            'keyframe',
            effectiveVideoInputMode === 'storyboard-grid' ? 'Grid Storyboard' : 'Tạo khung hình chính',
            effectiveVideoInputMode === 'storyboard-grid'
              ? 'Chọn Grid hoặc Khung hình chính, hiện tại là chế độ Grid'
              : 'Hoàn thành khung hình đầu/cuối trước khi tạo video',
            steps[2]?.done
          )}
          {isSectionOpen('keyframe') && (
            <div className="border-t border-[var(--border-primary)] p-3 space-y-3">
              <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-base)]/40 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                    Chế độ điều khiển cảnh (Chọn 1 trong 2)
                  </p>
                  <span className="text-[9px] text-[var(--accent-text)] bg-[var(--accent-bg)] border border-[var(--accent-border)] px-2 py-0.5 rounded">
                    {recommendationText}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onVideoInputModeChange('keyframes')}
                    className={`px-2 py-2 rounded border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      effectiveVideoInputMode === 'keyframes'
                        ? 'border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]'
                        : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Đầu-Cuối
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onVideoInputModeChange('storyboard-grid');
                      if (!isAdvancedMode) setIsAdvancedMode(true);
                    }}
                    className={`px-2 py-2 rounded border text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      effectiveVideoInputMode === 'storyboard-grid'
                        ? 'border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]'
                        : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Grid Storyboard
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Grid Storyboard và Khung hình đầu-cuối là loại trừ lẫn nhau: Khi chuyển sang chế độ Grid, video sẽ tự động bỏ qua khung hình cuối.
                </p>
              </div>

              {effectiveVideoInputMode === 'keyframes' ? (
                <KeyframeEditor
                  startKeyframe={startKf}
                  endKeyframe={endKf}
                  showEndFrame={showEndFrame}
                  canCopyPrevious={shotIndex > 0}
                  canCopyNext={shotIndex < totalShots - 1 && nextShotHasStartFrame}
                  isAIOptimizing={isAIOptimizing}
                  useAIEnhancement={useAIEnhancement}
                  onToggleAIEnhancement={onToggleAIEnhancement}
                  onGenerateKeyframe={onGenerateKeyframe}
                  onUploadKeyframe={onUploadKeyframe}
                  onEditPrompt={onEditKeyframePrompt}
                  onOptimizeWithAI={onOptimizeKeyframeWithAI}
                  onOptimizeBothWithAI={onOptimizeBothKeyframes}
                  onCopyPrevious={onCopyPreviousEndFrame}
                  onCopyNext={onCopyNextStartFrame}
                  onImageClick={onImageClick}
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {([4, 6, 9] as const).map((count) => {
                      const layout = STORYBOARD_GRID_LAYOUTS[count];
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setSelectedGridPanelCount(count)}
                          className={`px-2 py-1.5 rounded border text-[10px] font-semibold transition-colors ${
                            selectedGridPanelCount === count
                              ? 'border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent-text)]'
                              : 'border-[var(--border-primary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {layout.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Tối ưu: Cảnh quay 8 giây mặc định gợi ý 6 khung hình để giảm tần suất cắt cảnh.
                  </p>

                  <button
                    onClick={openOrGenerateGridStoryboard}
                    disabled={isGridGenerating}
                    className={`w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                      isGridGenerating
                        ? 'bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border-primary)] cursor-wait'
                        : nineGrid?.status === 'completed' && hasSameGridLayout
                          ? 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]'
                          : nineGrid?.status === 'panels_ready' && hasSameGridLayout
                            ? 'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]'
                            : 'bg-[var(--bg-base)] text-[var(--text-tertiary)] border-[var(--border-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {nineGrid?.status === 'generating_panels' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tạo mô tả phân cảnh...</span>
                      </>
                    ) : nineGrid?.status === 'generating_image' ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tạo ảnh {selectedGridLayout.label}...</span>
                      </>
                    ) : nineGrid?.status === 'completed' && hasSameGridLayout ? (
                      <>
                        <Grid3x3 className="w-3.5 h-3.5" />
                        <span>Xem phân cảnh {selectedGridLayout.label}</span>
                      </>
                    ) : nineGrid?.status === 'panels_ready' && hasSameGridLayout ? (
                      <>
                        <Grid3x3 className="w-3.5 h-3.5" />
                        <span>Xác nhận phân cảnh {selectedGridLayout.label}</span>
                      </>
                    ) : (
                      <>
                        <Grid3x3 className="w-3.5 h-3.5" />
                        <span>Tạo phân cảnh {selectedGridLayout.label}</span>
                      </>
                    )}
                  </button>

                  {!hasSameGridLayout && nineGrid?.panels?.length ? (
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Hiện đã có kết quả {existingGridLayout.label}, nhấn nút ở trên để tạo lại {selectedGridLayout.label}.
                    </p>
                  ) : null}

                  {nineGrid?.status === 'completed' && nineGrid.imageUrl && hasSameGridLayout && (
                    <div
                      className="relative bg-[var(--bg-base)] rounded-lg border border-[var(--border-primary)] overflow-hidden cursor-pointer group"
                      onClick={onShowNineGrid}
                    >
                      <img
                        src={nineGrid.imageUrl}
                        className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
                        alt={`Xem trước phân cảnh ${selectedGridLayout.label}`}
                      />
                      <div className="absolute inset-0 bg-[var(--bg-base)]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-[var(--text-primary)] text-xs font-mono">Nhấn để xem và chọn cảnh</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden">
          {renderSectionHeader('video', 'Tạo video', 'Chọn model, thiết lập tham số, tạo phim', steps[3]?.done)}
          {isSectionOpen('video') && (
            <div className="border-t border-[var(--border-primary)] p-3">
              <VideoGenerator
                shot={shot}
                hasStartFrame={hasStartFrame}
                hasEndFrame={hasEndFrame}
                onGenerate={onGenerateVideo}
                onEditPrompt={onEditVideoPrompt}
                onModelChange={(modelId) => {
                  setLocalVideoModelId(modelId);
                  onVideoModelChange(modelId);
                }}
              />
            </div>
          )}
        </section>

        {isAdvancedMode && (
          <section className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] overflow-hidden">
            {renderSectionHeader('advanced', 'Công cụ nâng cao', 'Tách cảnh và các tính năng thực nghiệm', undefined)}
            {isSectionOpen('advanced') && (
              <div className="border-t border-[var(--border-primary)] p-4 space-y-3">
                <button
                  onClick={onSplitShot}
                  disabled={isSplittingShot}
                  className="w-full py-2 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSplittingShot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                  {isSplittingShot ? 'Đang tách cảnh...' : 'AI tách cảnh'}
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="border-t border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{primaryAction.hint}</span>
        </div>
        <button
          type="button"
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
          className="w-full py-2.5 rounded-lg bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] text-xs font-bold tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {primaryAction.label}
        </button>
      </div>
    </div>
  );
};

export default ShotWorkbench;
