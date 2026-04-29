/**
 * Các hằng số cấu hình cho StageScript
 */

export const DURATION_OPTIONS = [
  { label: '30 giây (Quảng cáo)', value: '30s' },
  { label: '60 giây (Trailer)', value: '60s' },
  { label: '2 phút (Phim ngắn)', value: '120s' },
  { label: '5 phút (Phim trung bình)', value: '300s' },
  { label: 'Tùy chỉnh', value: 'custom' }
];

export const LANGUAGE_OPTIONS = [
  { label: 'Tiếng Việt (Vietnamese)', value: 'Vietnamese' },
  { label: 'English (US)', value: 'English' },
  // { label: '日本語 (Japanese)', value: 'Japanese' },
  // { label: 'Français (French)', value: 'French' },
  // { label: 'Español (Spanish)', value: 'Spanish' },
  //   { label: 'Tiếng Trung (Chinese)', value: 'Chinese' }
];

export const MODEL_OPTIONS = [
  { label: 'GPT-5.2 (Khuyên dùng)', value: 'gpt-5.2' },
  { label: 'GPT-5.1', value: 'gpt-5.1' },
  { label: 'GPT-4.1', value: 'gpt-41' },
  { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5-20250929' },
  { label: 'Khác (Tùy chỉnh)', value: 'custom' }
];

export const VISUAL_STYLE_OPTIONS = [
  { label: '🌟 Anime Nhật Bản', value: 'anime', desc: 'Phong cách Anime, đường nét mạnh mẽ' },
  { label: '🎨 Hoạt hình 2D', value: '2d-animation', desc: 'Phong cách Disney/Chaplin cổ điển' },
  { label: '👾 Hoạt hình 3D', value: '3d-animation', desc: 'Phong cách Pixar/Dreamworks' },
  { label: '🌌 Cyberpunk', value: 'cyberpunk', desc: 'Phong cách Cyberpunk công nghệ cao' },
  { label: '🖼️ Tranh sơn dầu', value: 'oil-painting', desc: 'Phong cách nghệ thuật sơn dầu' },
  { label: '🎬 Phim tả thực', value: 'live-action', desc: 'Phong cách điện ảnh/truyền hình siêu thực' },
  { label: '✨ Khác (Tùy chỉnh)', value: 'custom', desc: 'Nhập phong cách thủ công' }
];

export const STYLES = {
  input: 'w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] px-3 py-2.5 text-sm rounded-md focus:border-[var(--border-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-secondary)] transition-all placeholder:text-[var(--text-muted)]',
  label: 'text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest',
  select: 'w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] px-3 py-2.5 text-sm rounded-md appearance-none focus:border-[var(--border-secondary)] focus:outline-none transition-all cursor-pointer',
  button: {
    primary: 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] shadow-lg shadow-[var(--btn-primary-shadow)]',
    secondary: 'bg-transparent border-[var(--border-primary)] text-[var(--text-tertiary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-secondary)]',
    selected: 'bg-[var(--accent-bg-hover)] text-[var(--text-primary)] border-[var(--accent-border)] shadow-sm ring-1 ring-[var(--accent-border)]',
    disabled: 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] cursor-not-allowed'
  },
  editor: {
    textarea: 'w-full bg-[var(--bg-surface)] border border-[var(--border-secondary)] text-[var(--text-secondary)] px-3 py-2 text-sm rounded-md focus:border-[var(--border-primary)] focus:outline-none resize-none',
    mono: 'font-mono',
    serif: 'font-serif italic'
  }
};

export const DEFAULTS = {
  duration: '60s',
  language: 'Vietnamese',
  model: 'gpt-5.2',
  visualStyle: '3d-animation'
};

/**
 * Giới hạn số từ cho kịch bản/câu chuyện mỗi tập
 * soft: vượt quá sẽ hiển thị cảnh báo, không chặn quy trình
 * hard: vượt quá sẽ chặn tạo, khuyên chia thành nhiều tập
 */
export const SCRIPT_SOFT_LIMIT = 8000;
export const SCRIPT_HARD_LIMIT = 20000;
