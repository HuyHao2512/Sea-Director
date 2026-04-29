/**
 * Component danh sách model
 * Hiển thị danh sách model theo từng loại, hỗ trợ chọn model đang active
 */

import React, { useState, useEffect } from 'react';
import { Plus, Info, CheckCircle } from 'lucide-react';
import { 
  ModelType, 
  ModelDefinition, 
} from '../../types/model';
import {
  getModels,
  updateModel,
  registerModel,
  removeModel,
  getActiveModelsConfig,
  setActiveModel,
  getProviderById,
} from '../../services/modelRegistry';
import { useAlert } from '../GlobalAlert';
import ModelCard from './ModelCard';
import AddModelForm from './AddModelForm';

interface ModelListProps {
  type: ModelType;
  onRefresh: () => void;
}

const typeDescriptions: Record<ModelType, string> = {
  chat: 'Dùng cho phân tích kịch bản, tạo phân cảnh, tối ưu prompt và các tác vụ sinh văn bản',
  image: 'Dùng cho tạo nhân vật, tạo cảnh, tạo keyframe và các tác vụ sinh ảnh',
  video: 'Dùng cho tạo video',
};

const ModelList: React.FC<ModelListProps> = ({ type, onRefresh }) => {
  const [models, setModels] = useState<ModelDefinition[]>([]);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
  const [activeModelId, setActiveModelId] = useState<string>('');
  const { showAlert } = useAlert();

  useEffect(() => {
    loadModels();
  }, [type]);

  const loadModels = () => {
    const allModels = getModels(type);
    setModels(allModels);
    // Lấy model đang active
    const activeConfig = getActiveModelsConfig();
    setActiveModelId(activeConfig[type]);
  };

  const handleSetActiveModel = (modelId: string) => {
    if (setActiveModel(type, modelId)) {
      setActiveModelId(modelId);
      const model = models.find(m => m.id === modelId);
      const provider = model ? getProviderById(model.providerId) : null;
      showAlert(
        `Đã chuyển sang ${model?.name}${provider ? ` (${provider.name})` : ''}`, 
        { type: 'success' }
      );
      onRefresh();
    } else {
      showAlert('Thiết lập model active thất bại, hãy đảm bảo model đã được bật', { type: 'error' });
    }
  };

  const handleUpdateModel = (modelId: string, updates: Partial<ModelDefinition>) => {
    if (updateModel(modelId, updates)) {
      loadModels();
    }
  };

  const handleDeleteModel = (modelId: string) => {
    showAlert('Bạn có chắc muốn xóa model này không?', {
      type: 'warning',
      showCancel: true,
      onConfirm: () => {
        if (removeModel(modelId)) {
          loadModels();
          onRefresh();
          showAlert('Đã xóa model', { type: 'success' });
        }
      }
    });
  };

  const handleAddModel = (model: Omit<ModelDefinition, 'id' | 'isBuiltIn'>) => {
    try {
      registerModel(model);
      setIsAddingModel(false);
      loadModels();
      onRefresh();
      showAlert('Thêm model thành công', { type: 'success' });
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Thêm model thất bại', { type: 'error' });
    }
  };

  const handleToggleExpand = (modelId: string) => {
    setExpandedModelId(expandedModelId === modelId ? null : modelId);
  };

  return (
    <div className="space-y-4">
      {/* Mô tả loại */}
      <div className="mb-4">
        <p className="text-xs text-[var(--text-tertiary)]">{typeDescriptions[type]}</p>
      </div>

      {/* Thông tin model đang sử dụng */}
      <div className="bg-[var(--accent-bg)] border border-[var(--accent-border)] rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4 text-[var(--accent-text)]" />
          <span className="text-xs font-bold text-[var(--accent-text-hover)]">Đang sử dụng</span>
        </div>
        {(() => {
          const activeModel = models.find(m => m.id === activeModelId);
          const provider = activeModel ? getProviderById(activeModel.providerId) : null;
          return (
            <p className="text-[11px] text-[var(--text-secondary)]">
              <span className="font-medium">{activeModel?.name || 'Chưa chọn'}</span>
              {provider && (
                <span className="text-[var(--text-tertiary)] ml-2">
                  → {provider.name} ({provider.baseUrl})
                </span>
              )}
            </p>
          );
        })()}
      </div>

      {/* Thông tin hướng dẫn */}
      <div className="bg-[var(--bg-hover)]/50 border border-[var(--border-secondary)] rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
          Nhấn nút "Sử dụng model này" để chuyển model active. Nếu model tùy chỉnh có cấu hình provider riêng, request API sẽ được gửi tới địa chỉ tương ứng.
          Nhấn nút mở rộng để chỉnh tham số model.
        </p>
      </div>

      {/* Danh sách model */}
      <div className="space-y-2">
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            isExpanded={expandedModelId === model.id}
            isActive={activeModelId === model.id}
            onToggleExpand={() => handleToggleExpand(model.id)}
            onUpdate={(updates) => handleUpdateModel(model.id, updates)}
            onDelete={() => handleDeleteModel(model.id)}
            onSetActive={() => handleSetActiveModel(model.id)}
          />
        ))}
      </div>

      {/* Thêm model */}
      {isAddingModel ? (
        <AddModelForm
          type={type}
          onSave={handleAddModel}
          onCancel={() => setIsAddingModel(false)}
        />
      ) : (
        <button
          onClick={() => setIsAddingModel(true)}
          className="w-full py-3 border border-dashed border-[var(--border-secondary)] rounded-lg text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-secondary)] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm model tùy chỉnh
        </button>
      )}
    </div>
  );
};

export default ModelList;