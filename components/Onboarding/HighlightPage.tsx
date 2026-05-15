import React from 'react';
import { HIGHLIGHTS } from './constants';

interface HighlightPageProps {
  onNext: () => void;
}

const HighlightPage: React.FC<HighlightPageProps> = ({ onNext }) => {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Tiêu đề */}
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8">
        Cách dùng tính năng mới, hiểu ngay trong một trang
      </h2>

      <p className="text-[var(--text-tertiary)] text-sm mb-6 max-w-md">
        Các tính năng trọng tâm đã sẵn sàng, làm theo các bước dưới đây để làm quen nhanh
      </p>

      {/* Điểm nổi bật */}
      <div className="w-full max-w-md space-y-4 mb-8">
        {HIGHLIGHTS.map((highlight, index) => (
          <div
            key={index}
            className="flex items-start gap-4 bg-[var(--nav-hover-bg)] border border-[var(--border-primary)] rounded-xl p-4 text-left hover:border-[var(--accent-border)] transition-colors"
          >
            <span className="text-2xl flex-shrink-0">{highlight.icon}</span>
            <div>
              <h3 className="text-[var(--text-primary)] font-bold text-sm mb-1">{highlight.title}</h3>
              <p className="text-[var(--text-tertiary)] text-xs">{highlight.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lộ trình sử dụng */}
      <div className="w-full max-w-md bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded-xl px-6 py-4 mb-10 text-left">
        <h3 className="text-xs font-bold text-[var(--text-primary)] mb-3 uppercase tracking-wider">
          Lộ trình sử dụng đề xuất
        </h3>
        <div className="space-y-2 text-[11px] text-[var(--text-secondary)] leading-relaxed">
          <p>1. Tại "Bàn làm việc của Đạo diễn", nhấn "Xem trước bảng phân cảnh 9 ô", trước tiên xác nhận mô tả 9 cảnh rồi tạo hình ảnh 9 ô.</p>
          <p>2. Sau khi tạo, có thể nhấp vào một ô riêng lẻ để cắt làm khung hình đầu tiên, hoặc trực tiếp sử dụng toàn bộ hình ảnh 9 ô làm khung hình đầu tiên.</p>
          <p>3. Khi chọn các mô hình sê-ri Veo, nên điền khung hình đầu tiên + khung hình cuối cùng; nếu chỉ có khung hình đầu tiên cũng có thể tạo video từ một ảnh trước.</p>
        </div>
      </div>

      {/* Nút chính */}
      <button
        onClick={onNext}
        className="px-8 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-bold text-sm rounded-lg hover:bg-[var(--btn-primary-hover)] transition-all duration-200 transform hover:scale-105"
      >
        Tiếp tục bước tiếp theo
      </button>
    </div>
  );
};

export default HighlightPage;
