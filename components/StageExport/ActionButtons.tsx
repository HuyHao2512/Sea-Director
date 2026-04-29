import React from 'react';
import { Play, Download, FileVideo, Loader2 } from 'lucide-react';
import { DownloadState } from './constants';
import { useAlert } from '../GlobalAlert';
import { MasterExportMode, MasterVideoQuality } from '../../services/exportService';

interface Props {
  completedShotsCount: number;
  totalShots: number;
  progress: number;
  downloadState: DownloadState;
  exportMode: MasterExportMode;
  exportQuality: MasterVideoQuality;
  onExportModeChange: (mode: MasterExportMode) => void;
  onExportQualityChange: (quality: MasterVideoQuality) => void;
  onPreview: () => void;
  onDownloadMaster: () => void;
}

const ActionButtons: React.FC<Props> = ({
  completedShotsCount,
  totalShots,
  progress,
  downloadState,
  exportMode,
  exportQuality,
  onExportModeChange,
  onExportQualityChange,
  onPreview,
  onDownloadMaster
}) => {
  const { showAlert } = useAlert();
  const { isDownloading, phase, progress: downloadProgress } = downloadState;
  const canDownloadMaster = progress === 100;
  const canDownloadSegments = completedShotsCount > 0;
  const canDownloadByMode = exportMode === 'segments-zip' ? canDownloadSegments : canDownloadMaster;

  const modeLabel = exportMode === 'segments-zip' ? 'Tải xuống ZIP phân cảnh' : 'Tải xuống Video Master (WEBM)';
  const cardBase = 'min-h-[156px] rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between shadow-sm';
  const titleClass = 'text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider';
  const descClass = 'text-[10px] leading-relaxed text-[var(--text-tertiary)]';
  const ghostActionClass = 'h-10 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)] transition-colors text-xs font-semibold flex items-center justify-center gap-2';
  const disabledActionClass = 'h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed text-xs font-semibold flex items-center justify-center gap-2';
  const primaryActionClass = 'h-10 rounded-lg border border-[var(--accent-border)] bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] transition-colors text-xs font-bold flex items-center justify-center gap-2';
  const darkActionClass = 'h-10 rounded-lg border border-black/20 bg-black text-white hover:bg-black/90 transition-colors text-xs font-bold flex items-center justify-center gap-2';
  const loadingActionClass = 'h-10 rounded-lg border border-[var(--accent-border)] bg-[var(--accent)] text-[var(--accent-text)] cursor-wait text-xs font-bold flex items-center justify-center gap-2';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
      <div className={cardBase}>
        <div className="space-y-1.5">
          <p className={titleClass}>Kiểm tra xem trước</p>
          <p className={descClass}>Nhanh chóng kiểm tra thứ tự cảnh và độ hoàn thiện, tránh làm lại sau khi xuất phim.</p>
        </div>
        <button
          onClick={onPreview}
          disabled={completedShotsCount === 0}
          className={
            completedShotsCount > 0 ? primaryActionClass : disabledActionClass
          }
        >
          <Play className="w-4 h-4" />
          Xem trước video ({completedShotsCount}/{totalShots})
        </button>
      </div>

      <div className={cardBase}>
        <div className="space-y-2">
          <p className={titleClass}>Cài đặt xuất phim</p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={exportMode}
              onChange={(event) => onExportModeChange(event.target.value as MasterExportMode)}
              disabled={isDownloading}
              className="h-8 bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded px-2 text-[11px] focus:outline-none"
            >
              <option value="master-video">Ghép Master</option>
              <option value="segments-zip">ZIP phân cảnh</option>
            </select>
            {exportMode === 'master-video' ? (
              <select
                value={exportQuality}
                onChange={(event) => onExportQualityChange(event.target.value as MasterVideoQuality)}
                disabled={isDownloading}
                className="h-8 bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-[var(--text-secondary)] rounded px-2 text-[11px] focus:outline-none"
              >
                <option value="economy">Tiết kiệm</option>
                <option value="balanced">Cân bằng</option>
                <option value="pro">Chất lượng cao</option>
              </select>
            ) : (
              <div className="h-8 rounded border border-transparent bg-transparent" aria-hidden="true" />
            )}
          </div>
          <p className={descClass}>
            {exportMode === 'segments-zip'
              ? 'ZIP phân cảnh phù hợp để chỉnh sửa kịch trong phần mềm dựng phim.'
              : 'Ghép Master phù hợp để bàn giao nhanh, chất lượng ảnh hưởng đến dung lượng file.'}
          </p>
        </div>
        <button
          onClick={onDownloadMaster}
          disabled={!canDownloadByMode || isDownloading}
          className={
            isDownloading
              ? loadingActionClass
              : canDownloadByMode
                ? darkActionClass
                : disabledActionClass
          }
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isDownloading ? `${phase} ${downloadProgress}%` : modeLabel}
        </button>
      </div>

      <div className={cardBase}>
        <div className="space-y-1.5">
          <p className={titleClass}>Dự án dựng phim</p>
          <p className={descClass}>Xuất template dự án NLE (PR/FCP/ Resolve) để cộng tác sản xuất.</p>
        </div>
        <button
          className={ghostActionClass}
          onClick={() => showAlert('Tính năng đang phát triển', { type: 'info', title: 'Thông báo' })}
        >
          <FileVideo className="w-4 h-4" />
          Xuất file dự án dựng phim
        </button>
      </div>
    </div>
  );
};

export default ActionButtons;
