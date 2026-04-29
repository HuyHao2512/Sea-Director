/**
 * Mẫu prompt chia lưới phân cảnh (Chia sẻ)
 * Dành cho giao diện UI và các dịch vụ AI tái sử dụng, tránh việc sai lệch mẫu prompt
 */

import type { StoryboardGridPanelCount } from '../../types';

export interface StoryboardGridLayoutPreset {
  panelCount: StoryboardGridPanelCount;
  rows: number;
  cols: number;
  label: string;
  positionLabels: string[];
}

export const STORYBOARD_GRID_LAYOUTS: Record<StoryboardGridPanelCount, StoryboardGridLayoutPreset> = {
  4: {
    panelCount: 4,
    rows: 2,
    cols: 2,
    label: 'Bốn ô',
    positionLabels: ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'],
  },
  6: {
    panelCount: 6,
    rows: 2,
    cols: 3,
    label: 'Sáu ô',
    positionLabels: ['Top-Left', 'Top-Center', 'Top-Right', 'Bottom-Left', 'Bottom-Center', 'Bottom-Right'],
  },
  9: {
    panelCount: 9,
    rows: 3,
    cols: 3,
    label: 'Chín ô',
    positionLabels: [
      'Top-Left',
      'Top-Center',
      'Top-Right',
      'Middle-Left',
      'Center',
      'Middle-Right',
      'Bottom-Left',
      'Bottom-Center',
      'Bottom-Right',
    ],
  },
};

export const DEFAULT_STORYBOARD_PANEL_COUNT: StoryboardGridPanelCount = 9;

export const resolveStoryboardGridLayout = (panelCount?: number): StoryboardGridLayoutPreset => {
  if (panelCount === 4 || panelCount === 6 || panelCount === 9) {
    return STORYBOARD_GRID_LAYOUTS[panelCount];
  }
  return STORYBOARD_GRID_LAYOUTS[DEFAULT_STORYBOARD_PANEL_COUNT];
};

export const NINE_GRID_SPLIT_PROMPT = {
  system: `Bạn là một chuyên gia phân cảnh. Hãy chia 1 cảnh quay này thành {panelCount} góc nhìn không trùng lặp, dùng cho phân cảnh dạng lưới {gridLayout}. Giữ nguyên tính liên tục của phân cảnh và nhân vật.`,

  user: `Vui lòng phân tách hành động của cảnh quay dưới đây thành {panelCount} góc máy khác nhau, dùng để tạo một bảng phân cảnh dạng lưới {gridLayout}.

【Hành động cảnh quay】{actionSummary}
【Chuyển động máy ảnh gốc】{cameraMovement}
【Thông tin bối cảnh】Địa điểm: {location}, Thời gian: {time}, Không khí: {atmosphere}
【Nhân vật】{characters}
【Phong cách hình ảnh】{visualStyle}

Quy tắc đầu ra (Chỉ xuất JSON):
1) Cấp cao nhất là {"panels":[...]}
2) panels phải có chính xác {panelCount} phần tử, index=0-{lastIndex}, thứ tự từ trái sang phải, từ trên xuống dưới
3) Mỗi phần tử chứa shotSize, cameraAngle, description, và các mục này tuyệt đối không được để trống
4) shotSize/cameraAngle bằng ngôn ngữ tiếng Việt ngắn gọn; description bằng tiếng Anh, 1 câu đơn (10-30 từ), tập trung vào đối tượng chính, hành động, bố cục cảnh`
};

export const NINE_GRID_IMAGE_PROMPT_TEMPLATE = {
  prefix: `Create ONE cinematic storyboard image in a {gridLayout} grid ({panelCount} equal panels, thin white separators).
All panels depict the SAME scene; vary camera angle and shot size only.
Style: {visualStyle}
Panels (left-to-right, top-to-bottom):`,

  panelTemplate: `Panel {index} ({position}): [{shotSize} / {cameraAngle}] - {description}`,

  suffix: `Constraints:
- Output one single {gridLayout} grid image only
- Keep character identity consistent across all panels
- Keep lighting/color/mood consistent across all panels
- Each panel is a complete cinematic keyframe`
};

