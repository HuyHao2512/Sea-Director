import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ONBOARDING_STORAGE_KEY, ONBOARDING_PAGES, TOTAL_PAGES } from './constants';
import ProgressDots from './ProgressDots';
import WelcomePage from './WelcomePage';
import WorkflowPage from './WorkflowPage';
import HighlightPage from './HighlightPage';
import ApiKeyPage from './ApiKeyPage';
import ActionPage from './ActionPage';

interface OnboardingProps {
  onComplete: () => void;
  onQuickStart?: (option: 'script' | 'example') => void;
  currentApiKey?: string;
  onSaveApiKey?: (key: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onQuickStart, currentApiKey = '', onSaveApiKey }) => {
  const [currentPage, setCurrentPage] = useState(ONBOARDING_PAGES.WELCOME);
  const [isAnimating, setIsAnimating] = useState(false);

  // Xử lý hiệu ứng chuyển trang
  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsAnimating(false);
    }, 150);
  };

  const handleNext = () => {
    if (currentPage < TOTAL_PAGES - 1) {
      handlePageChange(currentPage + 1);
    }
  };

  const handleSkip = () => {
    markOnboardingComplete();
    onComplete();
  };

  const handleCompleteOnboarding = () => {
    markOnboardingComplete();
    onComplete();
  };

  const handleQuickStart = (option: 'script' | 'example') => {
    markOnboardingComplete();
    onQuickStart?.(option);
    onComplete();
  };

  const markOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  };

  // Xử lý lưu API Key
  const handleSaveApiKey = (key: string) => {
    onSaveApiKey?.(key);
  };

  // Bỏ qua cấu hình API Key, vào thẳng trang cuối
  const handleSkipApiKey = () => {
    handlePageChange(ONBOARDING_PAGES.ACTION);
  };

  // Render trang hiện tại
  const renderPage = () => {
    switch (currentPage) {
      case ONBOARDING_PAGES.WELCOME:
        return <WelcomePage onNext={handleNext} onSkip={handleSkip} />;
      case ONBOARDING_PAGES.WORKFLOW:
        return <WorkflowPage onNext={handleNext} />;
      case ONBOARDING_PAGES.HIGHLIGHTS:
        return <HighlightPage onNext={handleNext} />;
      case ONBOARDING_PAGES.API_KEY:
        return (
          <ApiKeyPage 
            currentApiKey={currentApiKey} 
            onSaveApiKey={handleSaveApiKey}
            onNext={handleNext}
            onSkip={handleSkipApiKey}
          />
        );
      case ONBOARDING_PAGES.ACTION:
        return <ActionPage onComplete={handleCompleteOnboarding} onQuickStart={handleQuickStart} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Nền mờ */}
      <div 
        className="absolute inset-0 bg-[var(--bg-base)]/90 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Container popup */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Nút đóng */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--bg-hover)]"
          aria-label="Đóng hướng dẫn"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Khu vực nội dung */}
        <div 
          className={`p-8 pt-12 transition-opacity duration-150 ${
            isAnimating ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {renderPage()}
        </div>

        {/* Thanh tiến trình */}
        <div className="pb-6">
          <ProgressDots 
            currentPage={currentPage} 
            onPageChange={handlePageChange} 
          />
        </div>
      </div>
    </div>
  );
};

// Kiểm tra xem có cần hiển thị hướng dẫn không
export const shouldShowOnboarding = (): boolean => {
  return localStorage.getItem(ONBOARDING_STORAGE_KEY) !== 'true';
};

// Đặt lại trạng thái hướng dẫn (dùng để kích hoạt lại trong menu trợ giúp)
export const resetOnboarding = (): void => {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
};

export default Onboarding;
