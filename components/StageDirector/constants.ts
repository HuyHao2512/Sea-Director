import { VISUAL_STYLE_PROMPTS as AI_VISUAL_STYLE_PROMPTS } from '../../services/ai/promptConstants';
import type { StoryboardGridLayoutMeta, StoryboardGridPanelCount } from '../../types';
import {
  NINE_GRID_SPLIT_PROMPT as SHARED_NINE_GRID_SPLIT_PROMPT,
  NINE_GRID_IMAGE_PROMPT_TEMPLATE as SHARED_NINE_GRID_IMAGE_PROMPT_TEMPLATE,
} from '../../services/ai/storyboardPromptTemplates';

// Hằng số giao diện UI
export const STYLES = {
  // Style container
  mainContainer: "flex flex-col h-full bg-[var(--bg-secondary)] relative overflow-hidden",
  toolbar: "h-16 border-b border-[var(--border-primary)] bg-[var(--bg-elevated)] px-6 flex items-center justify-between shrink-0",
  workbench: "w-[480px] bg-[var(--bg-deep)] flex flex-col h-full shadow-2xl animate-in slide-in-from-right-10 duration-300 relative z-20",
  workbenchHeader: "h-16 px-6 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0",
  workbenchContent: "flex-1 overflow-y-auto p-6 space-y-8",
  
  // Style card
  card: "group relative flex flex-col bg-[var(--bg-elevated)] border rounded-xl overflow-hidden cursor-pointer transition-all duration-200",
  cardActive: "border-[var(--accent)] ring-1 ring-[var(--accent-border)] shadow-xl scale-[0.98]",
  cardInactive: "border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:shadow-lg",
  
  // Style nút bấm
  primaryButton: "px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2 shadow-lg shadow-[var(--btn-primary-shadow)]",
  secondaryButton: "px-4 py-2 bg-[var(--bg-surface)] text-[var(--text-tertiary)] border border-[var(--border-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-primary)] rounded-lg text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-2",
  iconButton: "p-2 hover:bg-[var(--bg-hover)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors",
  
  // Style modal
  modalOverlay: "fixed inset-0 z-50 bg-[var(--overlay-heavy)] backdrop-blur-sm flex items-center justify-center p-4",
  modalContainer: "bg-[var(--bg-elevated)] border border-[var(--border-secondary)] rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-2xl",
  modalTextarea: "w-full h-64 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border-secondary)] rounded-lg p-4 text-sm outline-none focus:border-[var(--accent)] transition-colors resize-none",
  
  // Khu vực nội dung
  sectionHeader: "flex items-center gap-2 border-b border-[var(--border-primary)] pb-2",
  contentBox: "bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-primary)]",
};

// Cấu hình phong cách hình ảnh
export const VISUAL_STYLE_PROMPTS: Record<string, string> = AI_VISUAL_STYLE_PROMPTS;

// Mẫu prompt video
export const VIDEO_PROMPT_TEMPLATES = {
  sora2: {
    chinese: `Dựa trên hình ảnh tham khảo được cung cấp để tạo video.

Mô tả hành động: {actionSummary}
Phong cách hình ảnh: {visualStyle}

Yêu cầu kỹ thuật:
- Quan trọng: Video BẮT BUỘC phải bắt đầu bằng bố cục và nội dung chính xác của hình ảnh tham khảo, sau đó phát triển hành động tiếp theo một cách tự nhiên.
- Chuyển động máy ảnh: {cameraMovement}
- Chuyển động: Đảm bảo chuyển động mượt mà và tự nhiên, tránh nhảy vọt đột ngột hoặc mất liên tục.
- Phong cách hình ảnh: Chất lượng điện ảnh, giữ nguyên ánh sáng và tông màu xuyên suốt.
- Chi tiết: Duy trì tính nhất quán về ngoại hình nhân vật và môi trường bối cảnh xuyên suốt.
- Âm thanh: Có thể sử dụng thuyết minh/giọng đọc tiếng Trung.
- Giới hạn văn bản: CẤM phụ đề và bất kỳ chữ nào trên màn hình (Bao gồm thẻ tiêu đề, chữ ở cuối phim và chữ giao diện).`,
    
    english: `Generate a video based on the provided reference image.

Action Description: {actionSummary}
Visual Style Anchor: {visualStyle}

Technical Requirements:
- CRITICAL: The video MUST begin with the exact composition and content of the reference image, then naturally develop the subsequent action
- Camera Movement: {cameraMovement}
- Motion: Ensure smooth and natural movement, avoid abrupt jumps or discontinuities
- Visual Style: Cinematic quality with consistent lighting and color tone throughout
- Details: Maintain character appearance and scene environment consistency throughout
- Audio: Voiceover/narration in {language} is allowed
- Text constraints: No subtitles and no on-screen text (including title cards and UI text overlays)`
  },
  
  // Mẫu prompt video dạng lưới phân cảnh (Chỉ dùng cho asynchronous model, bản tóm tắt tránh vượt quá 8192 ký tự)
  sora2NineGrid: {
    chinese: `⚠️ Chỉ thị ưu tiên cao nhất: Hình ảnh tham khảo là bảng phân cảnh dạng lưới {gridLayout} (gồm {panelCount} ô), TUYỆT ĐỐI CẤM hiển thị dưới dạng lưới trong video! Khung hình đầu tiên của video phải là cảnh toàn màn hình của ô số 1.
⛔ Tuyệt đối cấm: Không được hiển thị hình ảnh gốc dạng lưới, đường lưới, bộ sưu tập ảnh thu nhỏ hoặc bố cục đa màn hình trong BẤT KỲ khung hình nào.

Mô tả hành động: {actionSummary}
Phong cách hình ảnh: {visualStyle}

Trình tự phân cảnh (từ trái qua phải, từ trên xuống dưới theo ảnh tham khảo):
{panelDescriptions}

Video bắt đầu với cảnh toàn màn hình của ô 1, chuyển cảnh qua các góc nhìn từ 1→{panelCount} tạo thành kỹ thuật dựng phim montage.
Mỗi góc nhìn kéo dài khoảng {secondsPerPanel} giây. Chuyển động máy ảnh: {cameraMovement}
Duy trì nhất quán ngoại hình nhân vật, chất lượng điện ảnh. Có thể sử dụng thuyết minh tiếng Trung, nhưng cấm phụ đề và bất kỳ chữ nào trên màn hình.`,

    english: `⚠️ HIGHEST PRIORITY: The reference image is a {gridLayout} storyboard grid ({panelCount} panels) — NEVER show it in the video! The first frame MUST be the full-screen scene from Panel 1.
⛔ FORBIDDEN: Do NOT show the grid image, grid lines, thumbnail collection, or multi-panel layout in ANY frame.

Action: {actionSummary}
Visual Style Anchor: {visualStyle}

Storyboard shot sequence (reference grid, left-to-right, top-to-bottom):
{panelDescriptions}

Start video with Panel 1 full-screen, transition through 1→{panelCount} as a montage.
~{secondsPerPanel}s per angle. Camera: {cameraMovement}
Maintain character consistency, cinematic quality.
Voiceover in {language} is allowed, but no subtitles or any on-screen text.`
  },

  veo: {
    simple: `{actionSummary}
Phong cách hình ảnh: {visualStyle}

Chuyển động máy ảnh: {cameraMovement}
Âm thanh: Có thể sử dụng thuyết minh/giọng đọc {language}
Giới hạn văn bản: Cấm phụ đề và bất kỳ văn bản nào trên màn hình`
  }
};

// Cấu hình mặc định
export const DEFAULTS = {
  videoModel: 'sora-2' as const,
  batchGenerateDelay: 3000, // Độ trễ sinh hàng loạt (ms)
};

// ============================================
// Các hằng số xem trước phân cảnh chia lưới (Tính năng nâng cao)
// ============================================

export const STORYBOARD_GRID_LAYOUTS: Record<
  StoryboardGridPanelCount,
  StoryboardGridLayoutMeta & { label: string; shortLabel: string; positionLabels: string[] }
> = {
  4: {
    panelCount: 4,
    rows: 2,
    cols: 2,
    label: 'Bốn ô',
    shortLabel: '4 ô',
    positionLabels: [
      'Trái - trên (Top-Left)',
      'Phải - trên (Top-Right)',
      'Trái - dưới (Bottom-Left)',
      'Phải - dưới (Bottom-Right)',
    ],
  },
  6: {
    panelCount: 6,
    rows: 2,
    cols: 3,
    label: 'Sáu ô',
    shortLabel: '6 ô',
    positionLabels: [
      'Trái - trên (Top-Left)',
      'Giữa - trên (Top-Center)',
      'Phải - trên (Top-Right)',
      'Trái - dưới (Bottom-Left)',
      'Giữa - dưới (Bottom-Center)',
      'Phải - dưới (Bottom-Right)',
    ],
  },
  9: {
    panelCount: 9,
    rows: 3,
    cols: 3,
    label: 'Chín ô',
    shortLabel: '9 ô',
    positionLabels: [
      'Trái - trên (Top-Left)',
      'Giữa - trên (Top-Center)',
      'Phải - trên (Top-Right)',
      'Trái - giữa (Middle-Left)',
      'Chính giữa (Center)',
      'Phải - giữa (Middle-Right)',
      'Trái - dưới (Bottom-Left)',
      'Giữa - dưới (Bottom-Center)',
      'Phải - dưới (Bottom-Right)',
    ],
  },
};

export const DEFAULT_STORYBOARD_PANEL_COUNT: StoryboardGridPanelCount = 9;

export const resolveStoryboardGridLayout = (
  panelCount?: number,
  fallbackPanelLength?: number
) => {
  const candidate = panelCount ?? fallbackPanelLength;
  if (candidate === 4 || candidate === 6 || candidate === 9) {
    return STORYBOARD_GRID_LAYOUTS[candidate];
  }
  return STORYBOARD_GRID_LAYOUTS[DEFAULT_STORYBOARD_PANEL_COUNT];
};

export const getStoryboardPositionLabel = (
  panelIndex: number,
  panelCount?: number,
  fallbackPanelLength?: number
): string => {
  const layout = resolveStoryboardGridLayout(panelCount, fallbackPanelLength);
  return layout.positionLabels[panelIndex] || `Ô ${panelIndex + 1}`;
};

export const NINE_GRID = {
  // Danh sách góc máy tiêu biểu
  defaultShotSizes: ['Quay xa', 'Toàn cảnh', 'Trung toàn cảnh', 'Trung cảnh', 'Trung cận cảnh', 'Cận cảnh', 'Đặc tả', 'Rất đặc tả', 'Cực kỳ đặc tả'],
  // Danh sách góc nghiêng máy tiêu biểu
  defaultCameraAngles: ['Góc cao', 'Ngang tầm mắt', 'Góc thấp', 'Chụp nghiêng', 'Chính diện', 'Chụp sau lưng', 'Góc chéo', 'Nhìn từ trên cao', 'Góc sát đất'],
};

// Mẫu prompt AI chia lưới 9 ô (Chia sẻ, dùng cho Chat model)
export const NINE_GRID_SPLIT_PROMPT = SHARED_NINE_GRID_SPLIT_PROMPT;

// Mẫu prompt sinh ảnh lưới 9 ô (Chia sẻ, dùng cho Gemini Image)
export const NINE_GRID_IMAGE_PROMPT_TEMPLATE = SHARED_NINE_GRID_IMAGE_PROMPT_TEMPLATE;
