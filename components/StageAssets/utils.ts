import { REGIONAL_FEATURES, LANGUAGE_MAP, DEFAULTS } from './constants';
import { convertImageToBase64 } from '../../services/storageService';

/**
 * Lấy tiền tố đặc trưng vùng miền theo ngôn ngữ
 */
export const getRegionalPrefix = (
  language: string,
  type: 'character' | 'scene'
): string => {
  const mappedLanguage = LANGUAGE_MAP[language];
  if (!mappedLanguage) return '';
  
  const features = REGIONAL_FEATURES[mappedLanguage];
  return features ? features[type] : '';
};

/**
 * Hàm xử lý tải ảnh lên chung
 */
export const handleImageUpload = async (file: File): Promise<string> => {
  try {
    return await convertImageToBase64(file);
  } catch (e: any) {
    console.error('Tải ảnh lên thất bại:', e);
    throw new Error(e.message || 'Tải ảnh lên thất bại');
  }
};

/**
 * Lấy cấu hình ngôn ngữ dự án
 */
export const getProjectLanguage = (
  projectLanguage?: string,
  scriptLanguage?: string
): string => {
  return projectLanguage || scriptLanguage || DEFAULTS.language;
};

/**
 * Lấy phong cách hình ảnh dự án
 */
export const getProjectVisualStyle = (
  projectVisualStyle?: string,
  scriptVisualStyle?: string
): string => {
  return projectVisualStyle || scriptVisualStyle || DEFAULTS.visualStyle;
};

/**
 * Trì hoãn thực thi
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Tạo ID duy nhất
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}`;
};

/**
 * So sánh ID (chuyển đổi thống nhất sang chuỗi để so sánh)
 */
export const compareIds = (id1: string | number, id2: string | number): boolean => {
  return String(id1) === String(id2);
};
