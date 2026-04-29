import React, { useState, useEffect } from 'react';
import { X, Loader2, RefreshCw, Check, Grid3x3, AlertCircle, Image as ImageIcon, Crop, Edit2, Save, ArrowRight, Wand2, ImagePlus } from 'lucide-react';
import { NineGridData, NineGridPanel, AspectRatio } from '../../types';
import { resolveStoryboardGridLayout } from './constants';

interface NineGridPreviewProps {
  isOpen: boolean;
  nineGrid?: NineGridData;
  onClose: () => void;
  onSelectPanel: (panel: NineGridPanel) => void;
  onUseWholeImage: () => void;  // Sử dụng toàn bộ ảnh lưới 9 ô trực tiếp làm khung hình đầu
  onRegenerate: () => void;
  onRegenerateImage: () => void; // Chỉ tạo lại ảnh (giữ nguyên mô tả bảng điều khiển hiện có)
  onConfirmPanels: (panels: NineGridPanel[]) => void; // Tạo ảnh sau khi người dùng xác nhận bảng điều khiển
  onUpdatePanel: (index: number, panel: Partial<NineGridPanel>) => void; // Chỉnh sửa bảng điều khiển riêng lẻ
  /** Tỷ lệ khung hình hiện tại (ngang/dọc), dùng để điều chỉnh bố cục xem trước */
  aspectRatio?: AspectRatio;
}

const NineGridPreview: React.FC<NineGridPreviewProps> = ({
  isOpen,
  nineGrid,
  onClose,
  onSelectPanel,
  onUseWholeImage,
  onRegenerate,
  onRegenerateImage,
  onConfirmPanels,
  onUpdatePanel,
  aspectRatio = '16:9'
}) => {
  const [hoveredPanel, setHoveredPanel] = useState<number | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<number | null>(null);
  const [editingPanel, setEditingPanel] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ shotSize: string; cameraAngle: string; description: string }>({
    shotSize: '', cameraAngle: '', description: ''
  });

  // Khi chỉnh sửa bảng điều khiển, khởi tạo biểu mẫu chỉnh sửa
  useEffect(() => {
    if (editingPanel !== null && nineGrid?.panels?.[editingPanel]) {
      const panel = nineGrid.panels[editingPanel];
      setEditForm({
        shotSize: panel.shotSize,
        cameraAngle: panel.cameraAngle,
        description: panel.description
      });
    }
  }, [editingPanel, nineGrid?.panels]);

  if (!isOpen) return null;

  const isGeneratingPanels = nineGrid?.status === 'generating_panels';
  const isPanelsReady = nineGrid?.status === 'panels_ready';
  const isGeneratingImage = nineGrid?.status === 'generating_image';
  const hasFailed = nineGrid?.status === 'failed';
  const isCompleted = nineGrid?.status === 'completed' && nineGrid?.imageUrl;
  // Tương thích với trạng thái generating cũ
  const isGenerating = nineGrid?.status === 'generating_panels' || nineGrid?.status === 'generating_image' || (nineGrid?.status as string) === 'generating';
  const gridLayout = resolveStoryboardGridLayout(nineGrid?.layout?.panelCount, nineGrid?.panels?.length);
  const gridName = gridLayout.label;
  const panelCount = gridLayout.panelCount;
  const activePanels = nineGrid?.panels?.slice(0, panelCount) || [];

  const handlePanelClick = (index: number) => {
    if (isPanelsReady) {
      // Ở chế độ panels_ready, nhấp để vào chỉnh sửa
      setEditingPanel(editingPanel === index ? null : index);
    } else {
      setSelectedPanel(selectedPanel === index ? null : index);
    }
  };

  const handleConfirmSelect = () => {
    if (selectedPanel !== null && activePanels[selectedPanel]) {
      onSelectPanel(activePanels[selectedPanel]);
      setSelectedPanel(null);
    }
  };

  const handleSaveEdit = () => {
    if (editingPanel !== null) {
      onUpdatePanel(editingPanel, editForm);
      setEditingPanel(null);
    }
  };

  const handleConfirmAndGenerate = () => {
    if (activePanels.length === panelCount) {
      onConfirmPanels(activePanels);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[var(--overlay-heavy)] backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--bg-elevated)] border border-[var(--border-secondary)] rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-6 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-3">
            <Grid3x3 className="w-4 h-4 text-[var(--accent-text)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {gridName} (Xem trước)
            </h3>
            {isPanelsReady && (
              <span className="text-[10px] text-[var(--warning-text)] font-bold uppercase tracking-wider bg-[var(--warning-bg)] px-2 py-0.5 rounded border border-[var(--warning-border)]">
                Chờ xác nhận
              </span>
            )}
            {isCompleted && (
              <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider bg-[var(--bg-base)]/30 px-2 py-0.5 rounded">
                Advanced
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCompleted && (
              <button
                onClick={onRegenerateImage}
                className="px-3 py-1.5 bg-[var(--accent-bg)] hover:bg-[var(--accent-hover-bg)] text-[var(--accent-text)] border border-[var(--accent-border)] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                title={`Giữ nguyên mô tả, chỉ tạo lại ảnh ${gridName}`}
              >
                <ImagePlus className="w-3 h-3" />
                Tạo lại ảnh
              </button>
            )}
            {(isCompleted || isPanelsReady) && (
              <button
                onClick={onRegenerate}
                className="px-3 py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                title="Tạo lại cả mô tả và ảnh mới"
              >
                <RefreshCw className="w-3 h-3" />
                Tạo lại mô tả
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--error-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--error-text)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading Panels State */}
          {isGeneratingPanels && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin mb-6" />
              <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                Đang biên soạn mô tả ống kính...
              </h4>
              <p className="text-sm text-[var(--text-tertiary)]">
                AI đang tính toán bóc tách phân cảnh thành {panelCount} góc nhìn khác nhau, vui lòng chờ
              </p>
            </div>
          )}

          {/* Loading Image State */}
          {isGeneratingImage && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin mb-6" />
              <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                Đang vẽ ảnh đồ họa {gridName}...
              </h4>
              <p className="text-sm text-[var(--text-tertiary)]">
                Dựa trên {panelCount} mô tả ống kính bạn đã xác nhận, hệ thống đang xuất ảnh
              </p>
              {/* Hiển thị danh sách bảng điều khiển đã xác nhận */}
              {activePanels.length > 0 && (
                <div className="mt-6 w-full max-w-lg space-y-1.5 px-6">
                  {activePanels.map((panel, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-primary)]">
                      <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                        {panel.shotSize} / {panel.cameraAngle}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] truncate flex-1">
                        {panel.description.substring(0, 50)}...
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Failed State */}
          {hasFailed && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-[var(--error)] mb-6 opacity-60" />
              <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                Tạo thất bại
              </h4>
              <p className="text-sm text-[var(--text-tertiary)] mb-6">
                {activePanels.length > 0
                  ? `Kết xuất ảnh ${gridName} thất bại, hãy quay lại xác nhận mô tả rồi thử lại`
                  : 'Tạo mô tả góc quay thất bại, xin vui lòng thử lại'
                }
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onRegenerate}
                  className="px-4 py-2 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-3 h-3" />
                  Tạo lại từ đầu
                </button>
                {/* Nếu mô tả bảng điều khiển đã có, cho phép thử lại tạo ảnh trực tiếp */}
                {activePanels.length === panelCount && (
                  <button
                    onClick={handleConfirmAndGenerate}
                    className="px-4 py-2 bg-[var(--accent-bg)] hover:bg-[var(--accent-hover-bg)] text-[var(--accent-text)] border border-[var(--accent-border)] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3" />
                    Thử tạo lại ảnh
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Trạng thái Panels Ready - Người dùng xem xét và chỉnh sửa mô tả bảng điều khiển */}
          {isPanelsReady && activePanels.length > 0 && (
            <div className="p-6 space-y-4">
              {/* Thông báo gợi ý */}
              <div className="flex items-start gap-3 p-4 bg-[var(--warning-bg)] border border-[var(--warning-border)] rounded-lg">
                <Wand2 className="w-5 h-5 text-[var(--warning-text)] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[var(--warning-text)] mb-1">
                    AI đã biên soạn thành công {panelCount} góc nhìn, vui lòng kiểm tra và xác nhận
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Nhấn vào bất kỳ ô nào để sửa mô tả, góc máy và góc chụp. Sau khi hoàn tất và chắc chắn, bấm nút "Xác nhận & Tạo ảnh" ở bên dưới.
                  </p>
                </div>
              </div>

              {/* Danh sách bảng điều khiển - Có thể chỉnh sửa */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activePanels.map((panel, idx) => (
                  <div
                    key={idx}
                    className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                      editingPanel === idx
                        ? 'border-[var(--accent)] bg-[var(--accent-bg)] shadow-lg'
                        : 'border-[var(--border-primary)] bg-[var(--bg-surface)] hover:border-[var(--border-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer'
                    }`}
                    onClick={() => editingPanel !== idx && handlePanelClick(idx)}
                  >
                    {/* Phần đầu bảng điều khiển */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          editingPanel === idx
                            ? 'bg-[var(--accent)] text-white'
                            : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
                        }`}>
                          {idx + 1}
                        </span>
                        {editingPanel !== idx && (
                          <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                            {panel.shotSize} / {panel.cameraAngle}
                          </span>
                        )}
                      </div>
                      {editingPanel !== idx && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePanelClick(idx); }}
                          className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--accent-text)] transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Chế độ chỉnh sửa */}
                    {editingPanel === idx ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-[8px] uppercase tracking-wider text-[var(--text-muted)] font-bold mb-0.5 block">CỠ CẢNH</label>
                            <select
                              value={editForm.shotSize}
                              onChange={(e) => setEditForm(prev => ({ ...prev, shotSize: e.target.value }))}
                              className="w-full text-[10px] p-1.5 bg-[var(--bg-base)] border border-[var(--border-secondary)] rounded text-[var(--text-primary)] focus:border-[var(--accent)] outline-none"
                            >
                              {['Quay xa', 'Toàn cảnh', 'Trung cảnh', 'Cận cảnh', 'Đặc tả', 'Rất đặc tả'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-[8px] uppercase tracking-wider text-[var(--text-muted)] font-bold mb-0.5 block">GÓC QUAY</label>
                            <select
                              value={editForm.cameraAngle}
                              onChange={(e) => setEditForm(prev => ({ ...prev, cameraAngle: e.target.value }))}
                              className="w-full text-[10px] p-1.5 bg-[var(--bg-base)] border border-[var(--border-secondary)] rounded text-[var(--text-primary)] focus:border-[var(--accent)] outline-none"
                            >
                              {['Góc cao', 'Góc thấp', 'Ngang tầm mắt', 'Chụp nghiêng', 'Từ trên cao', 'Góc sát đất', 'Dutch angle', 'Qua vai'].map(a => (
                                <option key={a} value={a}>{a}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[8px] uppercase tracking-wider text-[var(--text-muted)] font-bold mb-0.5 block">MÔ TẢ KHUNG HÌNH (TIẾNG ANH TỐT HƠN)</label>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full text-[10px] p-2 bg-[var(--bg-base)] border border-[var(--border-secondary)] rounded text-[var(--text-primary)] focus:border-[var(--accent)] outline-none resize-none font-mono leading-relaxed"
                            rows={4}
                          />
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setEditingPanel(null)}
                            className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            Lưu ngay
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Chế độ xem trước */
                      <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed line-clamp-3">
                        {panel.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Nút xác nhận tạo */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-primary)]">
                <p className="text-[10px] text-[var(--text-muted)] max-w-[400px]">
                  Xác nhận xong {panelCount} bản nháp, AI sẽ bắt đầu vẽ hình ảnh lưới phân cảnh {gridLayout.cols}x{gridLayout.rows} {gridName}.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Để sau
                  </button>
                  <button
                    onClick={handleConfirmAndGenerate}
                    className="px-4 py-2.5 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-[var(--btn-primary-shadow)]"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Xác nhận & Tạo ảnh
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trạng thái hoàn thành - Nội dung chính */}
          {isCompleted && nineGrid && (
            <div className="p-6 space-y-4">
              <div className={`flex gap-6 ${aspectRatio === '9:16' ? 'items-start' : ''}`}>
                {/* Trái: Ảnh lưới 9 ô với lưới phủ */}
                <div className={aspectRatio === '9:16' ? 'w-[320px] shrink-0' : 'flex-1 min-w-0'}>
                  <div className="relative bg-[var(--bg-base)] rounded-lg border border-[var(--border-primary)] overflow-hidden">
                    {/* Ảnh cơ sở - Tự thích ứng với tỷ lệ ảnh thực tế */}
                    <img
                      src={nineGrid.imageUrl}
                      className="w-full h-auto block"
                      alt={`Xem trước grid ${gridName}`}
                    />
                    
                    {/* Lưới phủ - Các khu vực có thể nhấp động, phủ hoàn toàn ảnh */}
                    <div
                      className="absolute inset-0 grid"
                      style={{
                        gridTemplateColumns: `repeat(${gridLayout.cols}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${gridLayout.rows}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: panelCount }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`relative border transition-all duration-200 cursor-pointer group/cell ${
                            selectedPanel === idx
                              ? 'border-[var(--accent)] border-2 bg-[var(--accent)]/10 shadow-[inset_0_0_20px_rgba(var(--accent-rgb),0.15)]'
                              : hoveredPanel === idx
                                ? 'border-white/40 bg-white/5'
                                : 'border-transparent hover:border-white/20'
                          }`}
                          onMouseEnter={() => setHoveredPanel(idx)}
                          onMouseLeave={() => setHoveredPanel(null)}
                          onClick={() => handlePanelClick(idx)}
                        >
                          {/* Huy hiệu chỉ số bảng điều khiển */}
                          <div className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-opacity ${
                            hoveredPanel === idx || selectedPanel === idx
                              ? 'opacity-100'
                              : 'opacity-0 group-hover/cell:opacity-60'
                          } ${
                            selectedPanel === idx
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-black/60 text-white'
                          }`}>
                            {idx + 1}
                          </div>

                          {/* Dấu kiểm đã chọn */}
                          {selectedPanel === idx && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-[var(--accent)] rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}

                          {/* Mẹo di chuột */}
                          {hoveredPanel === idx && activePanels[idx] && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                              <p className="text-white text-[9px] font-bold">
                                {activePanels[idx].shotSize} / {activePanels[idx].cameraAngle}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phải: Danh sách mô tả bảng điều khiển */}
                <div className={`${aspectRatio === '9:16' ? 'flex-1 min-w-0' : 'w-64 shrink-0'} space-y-2`}>
                  <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest pb-1 border-b border-[var(--border-primary)]">
                    DANH SÁCH GÓC NHÌN ({panelCount})
                  </h4>
                  <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                    {activePanels.map((panel, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all duration-150 ${
                          selectedPanel === idx
                            ? 'bg-[var(--accent-bg)] border-[var(--accent-border)] ring-1 ring-[var(--accent)]'
                            : hoveredPanel === idx
                              ? 'bg-[var(--bg-hover)] border-[var(--border-secondary)]'
                              : 'bg-[var(--bg-surface)] border-[var(--border-primary)] hover:bg-[var(--bg-hover)]'
                        }`}
                        onMouseEnter={() => setHoveredPanel(idx)}
                        onMouseLeave={() => setHoveredPanel(null)}
                        onClick={() => handlePanelClick(idx)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                            selectedPanel === idx
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)]'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-[var(--text-secondary)] truncate">
                            {panel.shotSize} / {panel.cameraAngle}
                          </span>
                        </div>
                        <p className="text-[9px] text-[var(--text-tertiary)] leading-relaxed line-clamp-2 ml-7">
                          {panel.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Thanh hành động */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-primary)]">
                <p className="text-[10px] text-[var(--text-muted)] max-w-[280px]">
                  {selectedPanel !== null 
                    ? `Bạn đã chọn [Ô ${selectedPanel + 1}]: ${activePanels[selectedPanel]?.shotSize} / ${activePanels[selectedPanel]?.cameraAngle}`
                    : `Sử dụng toàn cảnh lưới phân cảnh ${gridName} làm khung hình đầu tiên, hoặc nhấn vào lưới để cắt ô ưng ý nhất`
                  }
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={onUseWholeImage}
                    className="px-3 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-secondary)] hover:border-[var(--border-primary)] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3 h-3" />
                    Dùng toàn bộ làm đầu
                  </button>
                  <button
                    onClick={handleConfirmSelect}
                    disabled={selectedPanel === null}
                    className="px-3 py-2 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[var(--btn-primary-shadow)]"
                  >
                    <Crop className="w-3 h-3" />
                    Lấy khung cắt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Trạng thái chờ xử lý (ban đầu, trước khi tạo lần đầu) */}
          {!nineGrid && (
            <div className="flex flex-col items-center justify-center py-20">
              <Grid3x3 className="w-12 h-12 text-[var(--text-muted)] mb-6 opacity-40" />
              <h4 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                Tạo lưới đa góc
              </h4>
              <p className="text-sm text-[var(--text-tertiary)] mb-6 text-center max-w-md">
                AI sẽ tự động tính toán chia cảnh quay của bạn ra nhiều góc nhìn,<br/>
                sau đó vẽ phác thảo toàn bộ giúp bạn dễ dàng chọn góc quay ưng ý!
              </p>
              <button
                onClick={onRegenerate}
                className="px-4 py-2 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-[var(--btn-primary-shadow)]"
              >
                <Grid3x3 className="w-3.5 h-3.5" />
                Tạo phác thảo phân cảnh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NineGridPreview;
