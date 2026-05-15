// Cấu hình hằng số Onboarding

export const ONBOARDING_STORAGE_KEY = 'aidirector_onboarding_completed';

export const ONBOARDING_PAGES = {
  WELCOME: 0,
  WORKFLOW: 1,
  HIGHLIGHTS: 2,
  API_KEY: 3,
  ACTION: 4,
} as const;

export const TOTAL_PAGES = 5;

// Các bước quy trình làm việc
export const WORKFLOW_STEPS = [
  {
    number: '①',
    title: 'Viết kịch bản',
    description: 'AI tự động trích xuất nhân vật và cảnh',
  },
  {
    number: '②',
    title: 'Định hình ảnh',
    description: 'Ảnh tham khảo nhân vật + Bảng tạo hình 9 ô',
  },
  {
    number: '③',
    title: 'Lên phân cảnh',
    description: 'Khung đầu/cuối/Bảng 9 ô điều khiển tạo video',
  },
  {
    number: '④',
    title: 'Xuất video',
    description: 'Kết hợp xuất video ngắn hoàn chỉnh',
  },
] as const;

// Điểm nhấn cốt lõi
export const HIGHLIGHTS = [
  {
    icon: '🎬',
    title: 'Nối khung đầu cuối',
    description: 'Có thể sao chép khung cuối cảnh trước sang khung đầu cảnh sau, chuyển cảnh mượt mà hơn',
  },
  {
    icon: '🧩',
    title: 'Phân cảnh 9 ô',
    description: 'Chia 9 góc nhìn bằng một cú nhấp, hỗ trợ lấy toàn ảnh hoặc cắt ô làm khung hình đầu tiên',
  },
  {
    icon: '👔',
    title: 'Tủ đồ nhân vật',
    description: 'Cùng một nhân vật, chuyển đổi nhiều tạo hình bất cứ lúc nào',
  },
  {
    icon: '🎨',
    title: 'Phong cách thống nhất',
    description: 'Tùy chọn người thật, anime, 3D, nhất quán toàn bộ video',
  },
] as const;

// Tùy chọn bắt đầu nhanh
export const QUICK_START_OPTIONS = [
  {
    id: 'script',
    icon: '📝',
    title: 'Bắt đầu từ kịch bản',
    description: 'Dán câu chuyện của bạn, AI sẽ giúp bạn chia cảnh',
  },
  {
    id: 'example',
    icon: '🎬',
    title: 'Xem dự án mẫu',
    description: 'Tham khảo cách người khác làm',
  },
] as const;
