import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

type AlertType = 'info' | 'success' | 'error' | 'warning';

interface AlertOptions {
  title?: string;
  type?: AlertType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (message: string, options?: AlertOptions) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertState {
  isOpen: boolean;
  message: string;
  title?: string;
  type: AlertType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const showAlert = useCallback((message: string, options?: AlertOptions) => {
    setAlertState({
      isOpen: true,
      message,
      title: options?.title,
      type: options?.type || 'info',
      onConfirm: options?.onConfirm,
      onCancel: options?.onCancel,
      confirmText: options?.confirmText || 'Xác nhận',
      cancelText: options?.cancelText || 'Hủy',
      showCancel: options?.showCancel || false
    });
  }, []);

  const closeAlert = useCallback(() => {
    if (alertState.onConfirm) {
      alertState.onConfirm();
    }
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, [alertState]);

  const handleCancel = useCallback(() => {
    if (alertState.onCancel) {
      alertState.onCancel();
    }
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, [alertState]);

  const getIcon = () => {
    switch (alertState.type) {
      case 'success': return <CheckCircle className="w-6 h-6 text-[var(--success)]" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-[var(--error)]" />;
      case 'warning': return <AlertCircle className="w-6 h-6 text-[var(--warning)]" />;
      default: return <Info className="w-6 h-6 text-[var(--info)]" />;
    }
  };

  const getTitle = () => {
    if (alertState.title) return alertState.title;
    switch (alertState.type) {
      case 'success': return 'Thành công';
      case 'error': return 'Lỗi';
      case 'warning': return 'Cảnh báo';
      default: return 'Thông báo';
    }
  };

  const isSpaceX = theme === 'spacex';

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert }}>
      {children}
      {alertState.isOpen && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
            isSpaceX
              ? 'bg-[var(--space-black)]/95 backdrop-blur-sm'
              : 'bg-[var(--bg-base)]/80 backdrop-blur-sm'
          }`}
          onClick={alertState.showCancel ? handleCancel : closeAlert}
        >
          <div
            className={`p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-200 ${
              isSpaceX
                ? 'border border-[var(--ghost-border)]'
                : 'bg-[var(--bg-elevated)] border border-[var(--border-secondary)] rounded-xl shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getIcon()}
                <h3 className={`text-lg font-semibold ${
                  isSpaceX
                    ? 'text-[var(--spectral-white)] uppercase tracking-[0.96px]'
                    : 'text-[var(--text-primary)]'
                }`}>{getTitle()}</h3>
              </div>
              <button
                onClick={alertState.showCancel ? handleCancel : closeAlert}
                className={`transition-colors ${
                  isSpaceX
                    ? 'text-[var(--text-muted)] hover:text-[var(--spectral-white)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`text-sm leading-relaxed ${
              isSpaceX
                ? 'text-[var(--text-secondary)]'
                : 'text-[var(--text-secondary)]'
            }`}>
              {alertState.message}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {alertState.showCancel && (
                <button
                  onClick={handleCancel}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isSpaceX
                      ? 'bg-transparent border border-[var(--ghost-border)] text-[var(--text-secondary)] hover:text-[var(--spectral-white)] hover:border-[var(--spectral-white)]'
                      : 'bg-[var(--bg-hover)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg'
                  }`}
                >
                  {alertState.cancelText}
                </button>
              )}
              <button
                onClick={closeAlert}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  isSpaceX
                    ? 'bg-[var(--ghost-surface)] border border-[var(--ghost-border)] text-[var(--spectral-white)] hover:bg-[var(--ghost-hover)] rounded-[32px]'
                    : 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] rounded-lg'
                }`}
              >
                {alertState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
