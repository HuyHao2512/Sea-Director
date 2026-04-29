/**
 * Component form thêm model
 * Hỗ trợ nhà cung cấp tùy chỉnh và endpoint
 */

import React, { useEffect, useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { 
  ModelType, 
  ModelDefinition,
  ChatModelParams,
  ImageModelParams,
  VideoModelParams,
  DEFAULT_CHAT_PARAMS,
  DEFAULT_IMAGE_PARAMS,
  DEFAULT_VIDEO_PARAMS_SORA,
  DEFAULT_VIDEO_PARAMS_VEO,
  DEFAULT_VIDEO_PARAMS_DOUBAO_SEEDANCE,
} from '../../types/model';
import { getProviders, addProvider } from '../../services/modelRegistry';
import { useAlert } from '../GlobalAlert';

interface AddModelFormProps {
  type: ModelType;
  onSave: (model: Omit<ModelDefinition, 'id' | 'isBuiltIn'>) => void;
  onCancel: () => void;
}

const AddModelForm: React.FC<AddModelFormProps> = ({ type, onSave, onCancel }) => {
  const existingProviders = getProviders();
  const { showAlert } = useAlert();
  
  const [name, setName] = useState('');
  const [apiModel, setApiModel] = useState('');
  const [description, setDescription] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [videoMode, setVideoMode] = useState<'sync' | 'async' | 'task'>('sync');
  
  // Cấu hình nhà cung cấp
  const [providerMode, setProviderMode] = useState<'existing' | 'custom'>('existing');
  const [selectedProviderId, setSelectedProviderId] = useState(existingProviders[0]?.id || 'gemini');
  const [customProviderName, setCustomProviderName] = useState('');
  const [customProviderBaseUrl, setCustomProviderBaseUrl] = useState('');
  const [customProviderApiKey, setCustomProviderApiKey] = useState('');
  
  // Mở rộng tùy chọn nâng cao
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (type !== 'video' || providerMode !== 'existing' || videoMode !== 'task') return;
    const volcengineProvider = existingProviders.find(
      p => p.id === 'volcengine' || p.baseUrl.toLowerCase().includes('volces.com')
    );
    if (volcengineProvider) {
      setSelectedProviderId(volcengineProvider.id);
    }
  }, [type, videoMode, providerMode]);

  const handleSave = () => {
    if (!name.trim() || !apiModel.trim()) {
      showAlert('Vui lòng điền tên model và tên API model', { type: 'warning' });
      return;
    }

    // Xử lý nhà cung cấp
    let providerId = selectedProviderId;
    
    if (providerMode === 'custom') {
      if (!customProviderName.trim() || !customProviderBaseUrl.trim()) {
        showAlert('Vui lòng điền tên nhà cung cấp và API Base URL', { type: 'warning' });
        return;
      }
      const sanitizedBaseUrl = customProviderBaseUrl.trim().replace(/\/+$/, '');
      // Tạo nhà cung cấp mới (bao gồm API Key)
      const newProvider = addProvider({
        name: customProviderName.trim(),
        baseUrl: sanitizedBaseUrl,
        apiKey: customProviderApiKey.trim() || undefined,
        isDefault: false,
      });
      providerId = newProvider.id;
    }

    // Thiết lập tham số mặc định theo loại model
    let params: ChatModelParams | ImageModelParams | VideoModelParams;
    let resolvedEndpoint = endpoint.trim() || undefined;
    
    if (type === 'chat') {
      params = { ...DEFAULT_CHAT_PARAMS };
      if (!resolvedEndpoint) resolvedEndpoint = '/v1/chat/completions';
    } else if (type === 'image') {
      params = { ...DEFAULT_IMAGE_PARAMS };
      if (!resolvedEndpoint) resolvedEndpoint = '/v1beta/models/{model}:generateContent';
    } else {
      params =
        videoMode === 'sync'
          ? { ...DEFAULT_VIDEO_PARAMS_VEO }
          : videoMode === 'task'
            ? { ...DEFAULT_VIDEO_PARAMS_DOUBAO_SEEDANCE }
            : { ...DEFAULT_VIDEO_PARAMS_SORA };

      if (!resolvedEndpoint) {
        resolvedEndpoint =
          videoMode === 'sync'
            ? '/v1/chat/completions'
            : videoMode === 'task'
              ? '/api/v3/contents/generations/tasks'
              : '/v1/videos';
      }
    }

    const model: Omit<ModelDefinition, 'id' | 'isBuiltIn'> = {
      name: name.trim(),
      apiModel: apiModel.trim(),
      type,
      providerId,
      endpoint: resolvedEndpoint,
      description: description.trim() || undefined,
      apiKey: providerMode === 'existing' ? (apiKey.trim() || undefined) : undefined,
      isEnabled: true,
      params,
    } as any;

    onSave(model);
  };

  return (
    <div className="bg-[var(--bg-elevated)]/50 border border-[var(--border-secondary)] rounded-lg p-4 space-y-4">
      <h4 className="text-sm font-bold text-[var(--text-primary)]">Thêm model tùy chỉnh</h4>
      
      {/* Thông tin cơ bản */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">Tên model *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: GPT-4 Turbo"
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-secondary)] rounded px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div>
          <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">Tên API model * (có thể trùng với model có sẵn)</label>
          <input
            type="text"
            value={apiModel}
            onChange={(e) => setApiModel(e.target.value)}
            placeholder="Ví dụ: gpt-4-turbo, claude-3-opus"
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-secondary)] rounded px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono"
          />
          <p className="text-[9px] text-[var(--text-muted)] mt-1">
            Trường này sẽ được dùng làm tham số model trong API; ID nội bộ sẽ tự động tạo
          </p>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">Mô tả (tuỳ chọn)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Thông tin mô tả (tuỳ chọn)"
          className="w-full bg-[var(--bg-hover)] border border-[var(--border-secondary)] rounded px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* API endpoint */}
      <div>
        <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">API endpoint</label>
        <input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder={type === 'chat' ? '/v1/chat/completions' : type === 'image' ? '/v1beta/models/{model}:generateContent' : '/v1/videos hoặc /api/v3/contents/generations/tasks'}
          className="w-full bg-[var(--bg-hover)] border border-[var(--border-secondary)] rounded px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono"
        />
        <p className="text-[9px] text-[var(--text-muted)] mt-1">
          Để trống sẽ dùng endpoint mặc định
        </p>
      </div>

      {/* API Key riêng */}
      {providerMode === 'existing' && (
        <div>
          <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">API Key (tuỳ chọn)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Để trống sẽ dùng API Key toàn cục"
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-secondary)] rounded px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono"
          />
          <p className="text-[9px] text-[var(--text-muted)] mt-1">
            Cấu hình API Key riêng cho model này, nếu để trống sẽ dùng Key global
          </p>
        </div>
      )}

      {/* Nút hành động */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 bg-[var(--accent)] text-[var(--text-primary)] text-xs font-bold rounded hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-1"
        >
          <Check className="w-3 h-3" />
          Thêm model
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 bg-[var(--bg-hover)] text-[var(--text-tertiary)] text-xs rounded hover:bg-[var(--border-secondary)] transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default AddModelForm;