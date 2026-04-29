import React, { useState } from 'react';
import { Edit3, Save, AlertCircle, Camera } from 'lucide-react';

interface PromptEditorProps {
  prompt: string;
  onSave: (newPrompt: string) => void;
  label?: string;
  placeholder?: string;
  maxHeight?: string;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  prompt,
  onSave,
  label = 'Prompt gợi ý',
  placeholder = 'Nhập mô tả hình ảnh...',
  maxHeight = 'max-h-[260px]',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(prompt);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedPrompt(prompt || '');
  };

  const handleSave = () => {
    onSave(editedPrompt.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedPrompt(prompt || '');
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest flex items-center gap-1.5">
          <Camera className="w-3 h-3" />
          {label}
        </label>
        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 hover:bg-[var(--bg-hover)] rounded"
            title="Sửa prompt"
          >
            <Edit3 className="w-3 h-3" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className={`flex-1 bg-[var(--bg-base)] border border-[var(--accent)] text-[var(--text-primary)] px-3 py-2 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none font-mono leading-relaxed min-h-[140px] ${maxHeight}`}
            placeholder={placeholder}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--text-primary)] rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
            >
              <Save className="w-3 h-3" />
              Lưu
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--border-secondary)] text-[var(--text-secondary)] rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div className={`flex-1 bg-[var(--nav-hover-bg)] border border-[var(--border-primary)] rounded-lg p-3 overflow-y-auto ${maxHeight}`}>
          {prompt ? (
            <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed font-mono">
              {prompt}
            </p>
          ) : (
            <div className="flex items-start gap-2 text-[var(--text-muted)]">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed">
                Chưa thiết lập prompt. Nhấn nút sửa để thêm mô tả hình ảnh.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptEditor;
