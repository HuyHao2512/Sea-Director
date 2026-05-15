import React from 'react';
import { QUICK_START_OPTIONS } from './constants';
import { FileText, Film } from 'lucide-react';

interface ActionPageProps {
  onComplete: () => void;
  onQuickStart: (option: 'script' | 'example') => void;
}

const icons = {
  script: FileText,
  example: Film,
};

const ActionPage: React.FC<ActionPageProps> = ({ onComplete, onQuickStart }) => {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Tiêu đề */}
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        Bắt đầu sáng tạo ngay bây giờ
      </h2>

      {/* Văn bản giải thích */}
      <p className="text-[var(--text-tertiary)] text-sm mb-8">
        Chọn một phương thức, trải nghiệm ngay
      </p>

      {/* Thẻ tùy chọn */}
      <div className="w-full max-w-md space-y-3 mb-8">
        {QUICK_START_OPTIONS.map((option) => {
          const Icon = icons[option.id as keyof typeof icons];
          return (
            <button
              key={option.id}
              onClick={() => onQuickStart(option.id as 'script' | 'example')}
              className="w-full flex items-center gap-4 bg-[var(--nav-hover-bg)] border border-[var(--border-primary)] rounded-xl p-4 text-left hover:border-[var(--accent-border)] hover:bg-[var(--bg-elevated)] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent-bg)] transition-colors">
                <Icon className="w-5 h-5 text-[var(--accent-text)]" />
              </div>
              <div>
                <h3 className="text-[var(--text-primary)] font-bold text-sm mb-1 flex items-center gap-2">
                  <span>{option.icon}</span>
                  {option.title}
                </h3>
                <p className="text-[var(--text-tertiary)] text-xs">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Nút chính */}
      <button
        onClick={onComplete}
        className="px-8 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-bold text-sm rounded-lg hover:bg-[var(--btn-primary-hover)] transition-all duration-200 transform hover:scale-105"
      >
        Tạo bộ phim ngắn đầu tiên của tôi
      </button>

      {/* Lối vào phụ */}
      <p className="mt-6 text-[10px] text-[var(--text-muted)]">
        Sau này có thể xem lại hướng dẫn ở "Trợ giúp" thanh bên
      </p>
    </div>
  );
};

export default ActionPage;
