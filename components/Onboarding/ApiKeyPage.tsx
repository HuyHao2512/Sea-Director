import React, { useState } from 'react';
import { Key, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { verifyApiKey } from '../../services/aiService';
import { USER_MANUAL_URL } from '../../constants/links';

interface ApiKeyPageProps {
  currentApiKey: string;
  onSaveApiKey: (key: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

const ApiKeyPage: React.FC<ApiKeyPageProps> = ({ 
  currentApiKey, 
  onSaveApiKey, 
  onNext,
  onSkip 
}) => {
  const [inputKey, setInputKey] = useState(currentApiKey);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>(
    currentApiKey ? 'success' : 'idle'
  );
  const [verifyMessage, setVerifyMessage] = useState(currentApiKey ? 'Đã cấu hình' : '');

  const handleVerifyAndContinue = async () => {
    if (!inputKey.trim()) {
      setVerifyStatus('error');
      setVerifyMessage('Vui lòng nhập API Key');
      return;
    }

    setIsVerifying(true);
    setVerifyStatus('idle');

    try {
      const result = await verifyApiKey(inputKey.trim());
      
      if (result.success) {
        setVerifyStatus('success');
        setVerifyMessage('Xác thực thành công!');
        onSaveApiKey(inputKey.trim());
        // Đợi một chút rồi chuyển sang bước tiếp theo
        setTimeout(() => {
          onNext();
        }, 500);
      } else {
        setVerifyStatus('error');
        setVerifyMessage(result.message);
      }
    } catch (error: any) {
      setVerifyStatus('error');
      setVerifyMessage(error.message || 'Lỗi xác thực');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      {/* Biểu tượng */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-border)] flex items-center justify-center">
          <Key className="w-8 h-8 text-[var(--accent-text)]" />
        </div>
        {verifyStatus === 'success' && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--success)] rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-[var(--text-primary)]" />
          </div>
        )}
      </div>

      {/* Tiêu đề */}
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        Cấu hình Gemini API Key
      </h2>

      {/* Mô tả */}
      <p className="text-[var(--text-tertiary)] text-sm mb-6 max-w-xs">
        Bạn cần có API Key để sử dụng các tính năng tạo nội dung bằng AI.
      </p>

      {/* Nhắc nhở sử dụng */}
      <div className="w-full max-w-sm mb-6 text-left border border-[var(--border-primary)] bg-[var(--bg-surface)]/60 rounded-lg p-3">
        <h3 className="text-xs font-bold text-[var(--text-primary)] mb-2">
          Lưu ý sử dụng
        </h3>
        <div className="space-y-2 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
          <p>
            Dự án này hiện sử dụng mô hình Gemini trực tiếp từ Google AI Studio.
          </p>
          <p>
            Bạn có thể lấy API Key miễn phí (với hạn mức nhất định) hoặc trả phí tùy nhu cầu.
          </p>
          <p>
            Dữ liệu của bạn được lưu trữ tại trình duyệt máy tính cá nhân, chúng tôi không lưu trữ API Key của bạn trên máy chủ.
          </p>
        </div>
      </div>

      {/* Ô nhập liệu */}
      <div className="w-full max-w-sm mb-4">
        <input
          type="password"
          value={inputKey}
          onChange={(e) => {
            setInputKey(e.target.value);
            setVerifyStatus('idle');
            setVerifyMessage('');
          }}
          placeholder="Nhập Gemini API Key của bạn..."
          className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] px-4 py-3 text-sm rounded-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-hover)] transition-all font-mono placeholder:text-[var(--text-muted)] text-center"
          disabled={isVerifying}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputKey.trim() && !isVerifying) {
              handleVerifyAndContinue();
            }
          }}
        />

        {/* Trạng thái */}
        {verifyMessage && (
          <div className={`mt-2 flex items-center justify-center gap-2 text-xs ${
            verifyStatus === 'success' ? 'text-[var(--success-text)]' : 'text-[var(--error-text)]'
          }`}>
            {verifyStatus === 'success' ? (
              <CheckCircle className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {verifyMessage}
          </div>
        )}
      </div>

      {/* Link nhận Key */}
      <div className="flex items-center gap-4 mb-8">
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noreferrer" 
          className="text-xs text-[var(--accent-text)] hover:underline inline-flex items-center gap-1"
        >
          Lấy API Key miễn phí <ExternalLink className="w-3 h-3" />
        </a>
        <span className="text-[var(--text-muted)]">|</span>
        <a 
          href={USER_MANUAL_URL}
          target="_blank" 
          rel="noreferrer" 
          className="text-xs text-[var(--accent-text)] hover:underline inline-flex items-center gap-1"
        >
          Hướng dẫn sử dụng <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Nút chính */}
      <button
        onClick={handleVerifyAndContinue}
        disabled={isVerifying}
        className="px-8 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-bold text-sm rounded-lg hover:bg-[var(--btn-primary-hover)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang xác thực...
          </>
        ) : (
          'Xác thực và tiếp tục'
        )}
      </button>

      {/* Bỏ qua */}
      <button
        onClick={onSkip}
        className="mt-4 text-xs text-[var(--text-muted)] hover:text-[var(--text-tertiary)] transition-colors"
      >
        Cấu hình sau trong cài đặt
      </button>
    </div>
  );
};

export default ApiKeyPage;
