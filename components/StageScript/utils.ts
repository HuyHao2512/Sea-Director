/**
 * Các hàm tiện ích cho StageScript
 */

import { Scene } from '../../types';
import { parseDurationToSeconds } from '../../services/durationParser';
import { SCRIPT_HARD_LIMIT } from './constants';

/**
 * Lấy giá trị cuối cùng được chọn (xử lý tùy chọn tùy chỉnh)
 */
export const getFinalValue = (selected: string, customInput: string): string => {
  return selected === 'custom' ? customInput : selected;
};

/**
 * Loại bỏ trùng lặp bối cảnh (theo location)
 */
export const deduplicateScenes = (scenes: Scene[] = []): Scene[] => {
  const seenLocations = new Set<string>();
  return scenes.filter(scene => {
    const normalizedLoc = scene.location.trim().toLowerCase();
    if (seenLocations.has(normalizedLoc)) {
      return false;
    }
    seenLocations.add(normalizedLoc);
    return true;
  });
};

/**
 * Tính toán thống kê văn bản
 */
export const getTextStats = (text: string) => {
  return {
    characters: text.length,
    lines: text.split('\n').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0
  };
};

/**
 * Kiểm tra tính đầy đủ của cấu hình
 */
export const validateConfig = (config: {
  script: string;
  duration: string;
  model: string;
  visualStyle: string;
}): { valid: boolean; error: string | null } => {
  const scriptText = config.script || '';

  if (!scriptText.trim()) {
    return { valid: false, error: 'Vui lòng nhập nội dung kịch bản.' };
  }
  if (scriptText.length > SCRIPT_HARD_LIMIT) {
    return {
      valid: false,
      error: `Độ dài kịch bản hiện tại ${scriptText.length} ký tự, đã vượt quá giới hạn ${SCRIPT_HARD_LIMIT}. Vui lòng chia thành nhiều tập trước khi tạo phân cảnh.`
    };
  }
  if (!config.duration) {
    return { valid: false, error: 'Vui lòng chọn thời lượng mục tiêu.' };
  }
  if (parseDurationToSeconds(config.duration) === null) {
    return { valid: false, error: 'Định dạng thời lượng mục tiêu không hợp lệ, vui lòng dùng ví dụ như 90s, 3m hoặc 2min.' };
  }
  if (!config.model) {
    return { valid: false, error: 'Vui lòng chọn hoặc nhập tên model.' };
  }
  if (!config.visualStyle) {
    return { valid: false, error: 'Vui lòng chọn hoặc nhập phong cách hình ảnh.' };
  }
  return { valid: true, error: null };
};
