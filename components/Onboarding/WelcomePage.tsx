import React from 'react';
import { Sparkles } from 'lucide-react';
import logoImg from '../../logo.png';

interface WelcomePageProps {
  onNext: () => void;
  onSkip: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onNext, onSkip }) => {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Khu vực ảnh lớn: Logo + trang trí */}
      <div className="relative mb-8">
        <div className="absolute -inset-8 bg-[var(--accent-bg)] rounded-full blur-3xl opacity-50"></div>
        <img 
          src={logoImg} 
          alt="AI Director" 
          className="w-24 h-24 relative z-10"
        />
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[var(--warning-text)] animate-pulse" />
      </div>

      {/* Lời chào */}
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
        Chào bạn, nhà sáng tạo
      </h1>

      {/* Giá trị cốt lõi */}
      <p className="text-xl text-[var(--text-secondary)] mb-2">
        Biến câu chuyện của bạn thành video ngắn sống động
      </p>

      {/* Mô tả */}
      <p className="text-sm text-[var(--text-tertiary)] mb-10 max-w-xs">
        Chỉ cần một kịch bản, AI sẽ lo phần còn lại
      </p>

      {/* Nút chính */}
      <button
        onClick={onNext}
        className="px-8 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-bold text-sm rounded-lg hover:bg-[var(--btn-primary-hover)] transition-all duration-200 transform hover:scale-105"
      >
        Xem cách sử dụng
      </button>

      {/* Bỏ qua */}
      <button
        onClick={onSkip}
        className="mt-6 text-xs text-[var(--text-muted)] hover:text-[var(--text-tertiary)] transition-colors"
      >
        Để sau tìm hiểu, bắt đầu ngay
      </button>
    </div>
  );
};

export default WelcomePage;