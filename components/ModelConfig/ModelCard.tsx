/**
 * Component thẻ mô hình
 * Hiển thị cấu hình của một mô hình
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, ToggleLeft, ToggleRight, CheckCircle, Circle } from 'lucide-react';
import { 
  ModelDefinition, 
  ChatModelParams,
  ImageModelParams,
  VideoModelParams,
  AspectRatio,
  VideoDuration
} from '../../types/model';
import { getProviderById } from '../../services/modelRegistry';

interface ModelCardProps {
  model: ModelDefinition;
  isExpanded: boolean;
  isActive: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<ModelDefinition>) => void;
  onDelete: () => void;
  onSetActive: () => void;
}

const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isExpanded,
  isActive,
  onToggleExpand,
  onUpdate,
  onDelete,
  onSetActive,
}) => {
  const [editParams, setEditParams] = useState<any>(model.params);
  const [editApiKey, setEditApiKey] = useState<string>(model.apiKey || '');
  const provider = getProviderById(model.providerId);
  const isVolcengineModel = model.providerId === 'volcengine';
  const modelHasApiKey = Boolean(model.apiKey?.trim());
  const providerHasApiKey = Boolean(provider?.apiKey?.trim());
  const isMissingVolcengineKey = isVolcengineModel && !modelHasApiKey && !providerHasApiKey;

  const handleParamChange = (key: string, value: any) => {
    const newParams = { ...editParams, [key]: value };
    setEditParams(newParams);
    onUpdate({ params: newParams } as any);
  };

  const handleToggleEnabled = () => {
    onUpdate({ isEnabled: !model.isEnabled });
  };

  const handleApiKeyChange = (value: string) => {
    setEditApiKey(value);
    onUpdate({ apiKey: value.trim() || undefined });
  };

  const renderChatParams = (params: ChatModelParams) => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">Nhiệt độ</label>
        <input
          type="number"
          min="0"
          max="2"
          step="0.1"
          value={editParams.temperature}
          onChange={(e) => handleParamChange('temperature', parseFloat(e.target.value))}
          className="w-full bg-[var(--bg-hover)] border border-[var(--border-secondary)] rounded px-3 py-2 text-xs text-[var(--text-primary)]"
        />
      </div>
      <div>
        <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">Token tối đa</label>
        <input
          type="number"
          min="1"
          max="128000"
          value={editParams.maxTokens ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            handleParamChange('maxTokens', value === '' ? undefined : parseInt(value));
          }}
          placeholder="Để trống = không giới hạn"
          className="w-full bg-[var(--bg-hover)] border border-[var(--border-secondary)] rounded px-3 py-2 text-xs text-[var(--text-primary)]"
        />
        <p className="text-[9px] text-[var(--text-muted)] mt-1">Để trống sẽ không giới hạn Token</p>
      </div>
    </div>
  );

  const renderImageParams = (params: ImageModelParams) => (
    <div>
      <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">Tỷ lệ mặc định</label>
      <div className="flex gap-2">
        {(params.supportedAspectRatios || ['16:9', '9:16']).map((ratio) => (
          <button
            key={ratio}
            onClick={() => handleParamChange('defaultAspectRatio', ratio)}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              editParams.defaultAspectRatio === ratio
                ? 'bg-[var(--accent)] text-[var(--text-primary)]'
                : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:bg-[var(--border-secondary)]'
            }`}
          >
            {ratio === '16:9' ? 'Ngang' : ratio === '9:16' ? 'Dọc' : 'Vuông'}
          </button>
        ))}
      </div>
    </div>
  );

  const renderVideoParams = (params: VideoModelParams) => (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">Tỷ lệ mặc định</label>
        <div className="flex gap-2">
          {editParams.supportedAspectRatios.map((ratio: AspectRatio) => (
            <button
              key={ratio}
              onClick={() => handleParamChange('defaultAspectRatio', ratio)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                editParams.defaultAspectRatio === ratio
                  ? 'bg-[var(--accent)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:bg-[var(--border-secondary)]'
              }`}
            >
              {ratio === '16:9' ? 'Ngang' : ratio === '9:16' ? 'Dọc' : 'Vuông'}
            </button>
          ))}
        </div>
      </div>
      {editParams.supportedDurations.length > 1 && (
        <div>
          <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">Thời lượng mặc định</label>
          <div className="flex gap-2">
            {editParams.supportedDurations.map((duration: VideoDuration) => (
              <button
                key={duration}
                onClick={() => handleParamChange('defaultDuration', duration)}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${
                  editParams.defaultDuration === duration
                    ? 'bg-[var(--accent)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:bg-[var(--border-secondary)]'
                }`}
              >
                {duration} giây
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="text-[10px] text-[var(--text-muted)]">
        Chế độ:{
          editParams.mode === 'sync'
            ? 'Đồng bộ (Veo)'
            : (model.endpoint || '').includes('/contents/generations/tasks')
              ? 'Bất đồng bộ (task Volcengine)'
              : 'Bất đồng bộ (kiểu Sora)'
        }
      </div>
    </div>
  );

  const apiModel = model.apiModel || model.id;

  return (
    <div 
      className={`bg-[var(--bg-elevated)]/50 border rounded-lg overflow-hidden transition-all ${
        isActive ? 'border-[var(--accent-border)] bg-[var(--accent-bg)]' : 'border-[var(--border-primary)]'
      } ${!model.isEnabled ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">{model.name}</span>
              {model.isBuiltIn && (
                <span className={`px-1.5 py-0.5 text-[9px] rounded ${
                  isVolcengineModel
                    ? 'bg-[var(--warning-bg)] text-[var(--warning-text)]'
                    : 'bg-[var(--border-secondary)] text-[var(--text-tertiary)]'
                }`}>
                  {isVolcengineModel ? 'Volcengine' : 'Mặc định'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
              Tên model API: {apiModel}
              {model.id !== apiModel && ` · ID nội bộ: ${model.id}`}
              {model.endpoint && ` · ${model.endpoint}`}
              {model.description && ` · ${model.description}`}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {model.isEnabled && !isActive && (
            <button
              onClick={onSetActive}
              className="px-2.5 py-1 bg-[var(--accent)] text-[var(--text-primary)] text-[10px] font-bold rounded hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-1"
              title="Dùng model này"
            >
              <Circle className="w-3 h-3" />
              Dùng
            </button>
          )}
          
          {isActive && (
            <span className="px-2.5 py-1 bg-[var(--accent-bg)] text-[var(--accent-text-hover)] text-[10px] font-bold rounded flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Đang dùng
            </span>
          )}

          <button
            onClick={handleToggleEnabled}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            title={model.isEnabled ? 'Tắt' : 'Bật'}
          >
            {model.isEnabled ? (
              <ToggleRight className="w-5 h-5 text-[var(--accent-text)]" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>

          {!model.isBuiltIn && (
            <button
              onClick={onDelete}
              className="text-[var(--text-tertiary)] hover:text-[var(--error-text)] transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onToggleExpand}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[var(--border-primary)]">
          <div className="pt-4 space-y-4">
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] block mb-1">
                API Key (để trống dùng key global)
              </label>
              {isVolcengineModel && (
                <p className="text-[9px] text-[var(--warning-text)] mb-1">
                  Model Volcengine không dùng key global, cần nhập key riêng.
                </p>
              )}
              <input
                type="password"
                value={editApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Để trống dùng key global"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-secondary)] rounded px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono"
              />
              {isMissingVolcengineKey && (
                <p className="text-[9px] text-[var(--error-text)] mt-1">
                  Chưa cấu hình key Volcengine → model không dùng được.
                </p>
              )}
              {model.apiKey && (
                <p className="text-[9px] text-[var(--success)] mt-1">✓ Đã có key riêng</p>
              )}
            </div>
            
            {model.type === 'chat' && renderChatParams(model.params)}
            {model.type === 'image' && renderImageParams(model.params)}
            {model.type === 'video' && renderVideoParams(model.params)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelCard;