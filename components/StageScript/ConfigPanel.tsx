import React from 'react';
import { BookOpen, Wand2, BrainCircuit, AlertCircle, ChevronRight } from 'lucide-react';
import OptionSelector from './OptionSelector';
import { DURATION_OPTIONS, LANGUAGE_OPTIONS, VISUAL_STYLE_OPTIONS, STYLES } from './constants';
import ModelSelector from '../ModelSelector';
import { parseDurationToSeconds } from '../../services/durationParser';

interface Props {
  title: string;
  duration: string;
  language: string;
  model: string;
  visualStyle: string;
  customDurationInput: string;
  customModelInput: string;
  customStyleInput: string;
  isProcessing: boolean;
  error: string | null;
  onShowModelConfig?: () => void;
  onTitleChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onVisualStyleChange: (value: string) => void;
  onCustomDurationChange: (value: string) => void;
  onCustomModelChange: (value: string) => void;
  onCustomStyleChange: (value: string) => void;
  enableQualityCheck: boolean;
  onToggleQualityCheck: (value: boolean) => void;
  onAnalyze: () => void;
  analyzeButtonLabel?: string;
  canCancelAnalyze?: boolean;
  onCancelAnalyze?: () => void;
}

const formatDuration = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} giây`);

  return parts.join(' ');
};

const ConfigPanel: React.FC<Props> = ({
  title,
  duration,
  language,
  model,
  visualStyle,
  customDurationInput,
  customModelInput,
  customStyleInput,
  isProcessing,
  error,
  onShowModelConfig,
  onTitleChange,
  onDurationChange,
  onLanguageChange,
  onModelChange,
  onVisualStyleChange,
  onCustomDurationChange,
  onCustomModelChange,
  onCustomStyleChange,
  enableQualityCheck,
  onToggleQualityCheck,
  onAnalyze,
  analyzeButtonLabel,
  canCancelAnalyze,
  onCancelAnalyze
}) => {
  const rawDurationValue = duration === 'custom' ? customDurationInput : duration;
  const parsedDurationSeconds = parseDurationToSeconds(rawDurationValue);
  const hasDurationInput = rawDurationValue.trim().length > 0;

  return (
    <div className="w-96 border-r border-[var(--border-primary)] flex flex-col bg-[var(--bg-primary)]">
      <div className="h-14 px-5 border-b border-[var(--border-primary)] flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-wide flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--text-tertiary)]" />
          Cấu hình dự án
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <div className="space-y-2">
          <label className={STYLES.label}>Tiêu đề dự án</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className={STYLES.input}
            placeholder="Nhập tên dự án..."
          />
        </div>

        <div className="space-y-2">
          <label className={STYLES.label}>Ngôn ngữ đầu ra</label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className={STYLES.select}
            >
              {LANGUAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none">
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] rotate-90" />
            </div>
          </div>
        </div>

        <OptionSelector
          label="Thời lượng mục tiêu"
          options={DURATION_OPTIONS}
          value={duration}
          onChange={onDurationChange}
          customInput={customDurationInput}
          onCustomInputChange={onCustomDurationChange}
          customPlaceholder="Nhập thời lượng (vd: 90s, 3m)"
          gridCols={2}
        />

        <div className="mt-2 text-[10px] leading-relaxed">
          {parsedDurationSeconds !== null ? (
            <p className="text-[var(--text-tertiary)]">
              Phân cảnh sẽ được lập kế hoạch theo <span className="font-mono text-[var(--text-secondary)]">{parsedDurationSeconds} giây</span>
              （{formatDuration(parsedDurationSeconds)}）.
            </p>
          ) : hasDurationInput ? (
            <p className="text-[var(--error)]">
              Định dạng thời gian không hợp lệ. Ví dụ hỗ trợ: 90s, 3m, 3min, 2m30s, 2:30.
            </p>
          ) : (
            <p className="text-[var(--text-muted)]">Định dạng hỗ trợ: 90s, 3m, 3min, 2m30s, 2:30.</p>
          )}
        </div>

        <div className="space-y-2">
          <ModelSelector
            type="chat"
            value={model}
            onChange={onModelChange}
            disabled={isProcessing}
            label="Model tạo phân cảnh"
          />
          <p className="text-[12px] text-[var(--text-muted)]">
            Bạn có thể thêm nhiều model hơn trong
            <button
              type="button"
              onClick={onShowModelConfig}
              className="mx-1 text-[var(--accent-text)] hover:text-[var(--accent-text-hover)] underline underline-offset-2 transition-colors"
            >
              Cấu hình Model
            </button>
            .
          </p>
        </div>

        <OptionSelector
          label="Phong cách hình ảnh"
          icon={<Wand2 className="w-3 h-3" />}
          options={VISUAL_STYLE_OPTIONS}
          value={visualStyle}
          onChange={onVisualStyleChange}
          customInput={customStyleInput}
          onCustomInputChange={onCustomStyleChange}
          customPlaceholder="Nhập phong cách (vd: Thủy mặc, Pixel, Tả thực)"
          gridCols={2}
        />

        <div className="space-y-2">
          <label className={STYLES.label}>Kiểm soát chất lượng</label>
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/40 px-3 py-2">
            <input
              type="checkbox"
              checked={enableQualityCheck}
              onChange={(e) => onToggleQualityCheck(e.target.checked)}
              disabled={isProcessing}
              className="mt-0.5 h-4 w-4 rounded border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--accent-text)]"
            />
            <span className="text-xs text-[var(--text-secondary)]">
              Bật kiểm tra và tự động sửa lỗi phân cảnh (Khuyên dùng)
            </span>
          </label>
          <p className="text-[10px] text-[var(--text-muted)]">
            Tự động chấm điểm và sửa lỗi (thiếu trường, cấu hình keyframe, ID tài nguyên không hợp lệ...) ngay sau khi tạo phân cảnh.
          </p>
        </div>
      </div>

      <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <button
          onClick={onAnalyze}
          disabled={isProcessing}
          className={`w-full py-3.5 font-bold text-xs tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
            isProcessing
              ? STYLES.button.disabled
              : STYLES.button.primary
          }`}
        >
          {isProcessing ? (
            <>
              <BrainCircuit className="w-4 h-4 animate-spin" />
              Đang phân tích thông minh...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              {analyzeButtonLabel || 'Tạo kịch bản phân cảnh'}
            </>
          )}
        </button>

        {isProcessing && canCancelAnalyze && onCancelAnalyze && (
          <button
            type="button"
            onClick={onCancelAnalyze}
            className={`mt-2 w-full rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${STYLES.button.secondary}`}
          >
            Hủy quy trình
          </button>
        )}

        {error && (
          <div className="mt-4 p-3 bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error)] text-xs rounded flex items-center gap-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigPanel;
