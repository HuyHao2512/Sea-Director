/**
 * 全局配置组件
 * 包含 API Key 配置和折扣广告
 */

import React, { useState, useEffect } from 'react';
import { Key, Loader2, CheckCircle, AlertCircle, ExternalLink, Gift, Sparkles } from 'lucide-react';
import { getGlobalApiKey, setGlobalApiKey } from '../../services/modelRegistry';
import { verifyApiKey } from '../../services/modelService';
import { USER_MANUAL_URL } from '../../constants/links';

interface GlobalSettingsProps {
  onRefresh: () => void;
}

const GlobalSettings: React.FC<GlobalSettingsProps> = ({ onRefresh }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifyMessage, setVerifyMessage] = useState('');

  useEffect(() => {
    const currentKey = getGlobalApiKey() || '';
    setApiKey(currentKey);
    if (currentKey) {
      setVerifyStatus('success');
      setVerifyMessage('API Key đã được cấu hình');
    }
  }, []);

  const handleVerifyAndSave = async () => {
    if (!apiKey.trim()) {
      setVerifyStatus('error');
      setVerifyMessage('Vui lòng nhập API Key');
      return;
    }

    setIsVerifying(true);
    setVerifyStatus('idle');
    setVerifyMessage('');

    try {
      const result = await verifyApiKey(apiKey.trim());
      
      if (result.success) {
        setVerifyStatus('success');
        setVerifyMessage('Xác thực thành công! API Key đã được lưu');
        setGlobalApiKey(apiKey.trim());
        onRefresh();
      } else {
        setVerifyStatus('error');
        setVerifyMessage(result.message);
      }
    } catch (error: any) {
      setVerifyStatus('error');
      setVerifyMessage(error.message || 'Lỗi trong quá trình xác thực');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearKey = () => {
    setApiKey('');
    setVerifyStatus('idle');
    setVerifyMessage('');
    setGlobalApiKey('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Thẻ quảng cáo/giới thiệu Gemini */}
      {/* <div className="bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6 text-[var(--text-primary)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--warning-text)]" />
              Sử dụng mô hình Gemini (Google)
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
              Hỗ trợ Gemini 2.0 Flash, Gemini 2.0 Pro, Imagen 3 và Veo 2.
              Tốc độ cao, ổn định và cực kỳ thông minh. Bạn có thể lấy API Key trực tiếp từ Google AI Studio.
            </p>
            <div className="flex items-center gap-3">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-xs font-bold rounded-lg hover:bg-[var(--btn-primary-hover)] transition-colors inline-flex items-center gap-1.5"
              >
                Lấy API Key miễn phí
                <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href={USER_MANUAL_URL}
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] text-xs font-bold rounded-lg hover:bg-[var(--border-secondary)] transition-colors inline-flex items-center gap-1.5"
              >
                Hướng dẫn sử dụng
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div> */}

      {/* API Key 配置 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-[var(--accent-text)]" />
          <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
            Gemini API Key Toàn Cục
          </label>
        </div>
        
        <div className="space-y-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setVerifyStatus('idle');
              setVerifyMessage('');
            }}
            placeholder="Nhập API Key của bạn..."
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] px-4 py-3 text-sm rounded-lg focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-hover)] transition-all font-mono placeholder:text-[var(--text-muted)]"
            disabled={isVerifying}
          />
          
          {/* 状态提示 */}
          {verifyMessage && (
            <div className={`flex items-center gap-2 text-xs ${
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

          {/* 说明文字 */}
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            Gemini API Key được sử dụng cho tất cả các mô hình. Bạn cũng có thể cấu hình API Key riêng cho từng nhà cung cấp.
          </p>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            {getGlobalApiKey() && (
              <button
                onClick={handleClearKey}
                className="flex-1 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-xs font-bold uppercase tracking-wider transition-colors rounded-lg border border-[var(--border-primary)]"
              >
                Xóa Key
              </button>
            )}
            <button
              onClick={handleVerifyAndSave}
              disabled={isVerifying || !apiKey.trim()}
              className="flex-1 py-3 bg-[var(--accent)] text-[var(--text-primary)] font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                'Xác thực và lưu'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 提示 */}
      <div className="p-4 bg-[var(--bg-elevated)]/50 rounded-lg border border-[var(--border-primary)]">
        <h4 className="text-xs font-bold text-[var(--text-tertiary)] mb-2">Thông tin cấu hình</h4>
        <ul className="text-[10px] text-[var(--text-muted)] space-y-1 list-disc list-inside">
          <li>API Key này được sử dụng cho các mô hình Gemini mặc định trong hệ thống.</li>
          <li>Bạn có thể điều chỉnh tham số mô hình (nhiệt độ, Token, v.v.) trong cài đặt riêng từng mô hình.</li>
          <li>Chúng tôi hỗ trợ thêm các nhà cung cấp mô hình tùy chỉnh khác qua giao diện cài đặt.</li>
          <li>Tất cả cấu hình chỉ được lưu cục bộ trên trình duyệt, không được tải lên máy chủ.</li>
        </ul>
      </div>
    </div>
  );
};

export default GlobalSettings;
