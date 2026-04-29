/**
 * Dịch vụ quản lý cấu hình mô hình
 * Quản lý cấu hình nhà cung cấp API và mô hình
 */

import { 
  ModelProvider, 
  ModelConfig, 
  ModelManagerState, 
  AspectRatio, 
  VideoDuration,
  ChatModelConfig,
  ImageModelConfig,
  VideoModelConfig
} from '../types';

// Khóa localStorage
const STORAGE_KEY = 'aidirector_model_config';

// Mặc định provider - Google Gemini
const DEFAULT_PROVIDER: ModelProvider = {
  id: 'gemini',
  name: 'Google Gemini (AI Studio)',
  baseUrl: 'https://generativelanguage.googleapis.com',
  isDefault: true,
  isBuiltIn: true
};

// Cấu hình model mặc định
const DEFAULT_CONFIG: ModelConfig = {
  chatModel: {
    providerId: 'gemini',
    modelName: 'gemini-2.0-flash',
    endpoint: '/v1beta/models/gemini-2.0-flash:generateContent'
  },
  imageModel: {
    providerId: 'gemini',
    modelName: 'gemini-2.5-flash-image',
    endpoint: '/v1beta/models/gemini-2.5-flash-image:generateContent'
  },
  videoModel: {
    providerId: 'gemini',
    type: 'veo',
    modelName: 'veo_3_1-fast',
    endpoint: '/v1beta/models/veo_3_1_i2v_s_fast_fl_landscape:predictLongRunning'
  }
};

// Trạng thái mặc định
const DEFAULT_STATE: ModelManagerState = {
  providers: [DEFAULT_PROVIDER],
  currentConfig: DEFAULT_CONFIG,
  defaultAspectRatio: '16:9',
  defaultVideoDuration: 8
};

// Bộ nhớ đệm trạng thái thời gian chạy
let runtimeState: ModelManagerState | null = null;

/**
 * Tải cấu hình từ localStorage
 */
export const loadModelConfig = (): ModelManagerState => {
  if (runtimeState) {
    return runtimeState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ModelManagerState;
      // Đảm bảo nhà cung cấp mặc định luôn tồn tại
      const hasDefaultProvider = parsed.providers.some(p => p.id === 'gemini');
      if (!hasDefaultProvider) {
        parsed.providers.unshift(DEFAULT_PROVIDER);
      }
      // Di chuyển tên mô hình Veo cũ thành veo thống nhất
      const videoModelName = parsed.currentConfig?.videoModel?.modelName || '';
      if (
        videoModelName === 'veo-3.1' ||
        videoModelName === 'veo-r2v' ||
        videoModelName === 'veo_3_1' ||
        videoModelName.startsWith('veo_3_1_') ||
        videoModelName.startsWith('veo_3_0_r2v')
      ) {
        parsed.currentConfig.videoModel.modelName = 'veo';
        parsed.currentConfig.videoModel.type = 'veo';
        parsed.currentConfig.videoModel.endpoint = '/v1/chat/completions';
        // Ghi lại ngay sau khi di chuyển để tránh thực hiện lặp lại
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch (e) { /* ignore */ }
      }
      runtimeState = parsed;
      return parsed;
    }
  } catch (e) {
    console.error('Không thể tải cấu hình mô hình:', e);
  }

  runtimeState = { ...DEFAULT_STATE };
  return runtimeState;
};

/**
 * Lưu cấu hình vào localStorage
 */
export const saveModelConfig = (state: ModelManagerState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    runtimeState = state;
  } catch (e) {
    console.error('Không thể lưu cấu hình mô hình:', e);
  }
};

/**
 * Lấy trạng thái cấu hình mô hình hiện tại
 */
export const getModelManagerState = (): ModelManagerState => {
  return loadModelConfig();
};

/**
 * Lấy danh sách tất cả các nhà cung cấp
 */
export const getProviders = (): ModelProvider[] => {
  return loadModelConfig().providers;
};

/**
 * Lấy nhà cung cấp theo ID
 */
export const getProviderById = (id: string): ModelProvider | undefined => {
  return getProviders().find(p => p.id === id);
};

/**
 * Lấy nhà cung cấp mặc định
 */
export const getDefaultProvider = (): ModelProvider => {
  return getProviders().find(p => p.isDefault) || DEFAULT_PROVIDER;
};

/**
 * Thêm nhà cung cấp mới
 */
export const addProvider = (provider: Omit<ModelProvider, 'id' | 'isBuiltIn'>): ModelProvider => {
  const state = loadModelConfig();
  const newProvider: ModelProvider = {
    ...provider,
    id: `provider_${Date.now()}`,
    isBuiltIn: false
  };
  state.providers.push(newProvider);
  saveModelConfig(state);
  return newProvider;
};

/**
 * Cập nhật nhà cung cấp
 */
export const updateProvider = (id: string, updates: Partial<ModelProvider>): boolean => {
  const state = loadModelConfig();
  const index = state.providers.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  // Không được phép sửa đổi một số thuộc tính của nhà cung cấp tích hợp
  if (state.providers[index].isBuiltIn) {
    delete updates.id;
    delete updates.isBuiltIn;
    delete updates.baseUrl;
  }
  
  state.providers[index] = { ...state.providers[index], ...updates };
  saveModelConfig(state);
  return true;
};

/**
 * Xóa nhà cung cấp
 */
export const deleteProvider = (id: string): boolean => {
  const state = loadModelConfig();
  const provider = state.providers.find(p => p.id === id);
  
  // Không được phép xóa các nhà cung cấp tích hợp
  if (!provider || provider.isBuiltIn) return false;
  
  state.providers = state.providers.filter(p => p.id !== id);
  
  // Nếu xóa nhà cung cấp đang sử dụng, hãy chuyển lại mặc định
  if (state.currentConfig.chatModel.providerId === id) {
    state.currentConfig.chatModel.providerId = 'gemini';
  }
  if (state.currentConfig.imageModel.providerId === id) {
    state.currentConfig.imageModel.providerId = 'gemini';
  }
  if (state.currentConfig.videoModel.providerId === id) {
    state.currentConfig.videoModel.providerId = 'gemini';
  }
  
  saveModelConfig(state);
  return true;
};

/**
 * Lấy cấu hình mô hình hiện tại
 */
export const getCurrentConfig = (): ModelConfig => {
  return loadModelConfig().currentConfig;
};

/**
 * Cập nhật cấu hình mô hình đối thoại
 */
export const updateChatModelConfig = (config: Partial<ChatModelConfig>): void => {
  const state = loadModelConfig();
  state.currentConfig.chatModel = { ...state.currentConfig.chatModel, ...config };
  saveModelConfig(state);
};

/**
 * Cập nhật cấu hình mô hình hình ảnh
 */
export const updateImageModelConfig = (config: Partial<ImageModelConfig>): void => {
  const state = loadModelConfig();
  state.currentConfig.imageModel = { ...state.currentConfig.imageModel, ...config };
  saveModelConfig(state);
};

/**
 * Cập nhật cấu hình mô hình video
 */
export const updateVideoModelConfig = (config: Partial<VideoModelConfig>): void => {
  const state = loadModelConfig();
  state.currentConfig.videoModel = { ...state.currentConfig.videoModel, ...config };
  saveModelConfig(state);
};

/**
 * Lấy URL API đầy đủ của mô hình đối thoại hiện tại
 */
export const getChatApiUrl = (): string => {
  const config = getCurrentConfig();
  const provider = getProviderById(config.chatModel.providerId) || getDefaultProvider();
  const baseUrl = provider.baseUrl.replace(/\/+$/, '');
  const endpoint = config.chatModel.endpoint || '/v1/chat/completions';
  return `${baseUrl}${endpoint}`;
};

/**
 * Lấy URL API đầy đủ của mô hình hình ảnh hiện tại
 */
export const getImageApiUrl = (): string => {
  const config = getCurrentConfig();
  const provider = getProviderById(config.imageModel.providerId) || getDefaultProvider();
  const baseUrl = provider.baseUrl.replace(/\/+$/, '');
  const modelName = config.imageModel.modelName || 'gemini-3-pro-image-preview';
  const endpoint = config.imageModel.endpoint || `/v1beta/models/${modelName}:generateContent`;
  return `${baseUrl}${endpoint}`;
};

/**
 * Lấy URL API đầy đủ của mô hình video hiện tại (chỉ dùng cho API video không đồng bộ)
 */
export const getVideoApiUrl = (): string => {
  const config = getCurrentConfig();
  const provider = getProviderById(config.videoModel.providerId) || getDefaultProvider();
  const baseUrl = provider.baseUrl.replace(/\/+$/, '');
  
  if (config.videoModel.type === 'sora') {
    return `${baseUrl}/v1/videos`;
  } else {
    return `${baseUrl}/v1/chat/completions`;
  }
};

/**
 * Lấy URL cơ sở của nhà cung cấp hiện tại
 */
export const getApiBaseUrl = (type: 'chat' | 'image' | 'video' = 'chat'): string => {
  const config = getCurrentConfig();
  let providerId: string;
  
  switch (type) {
    case 'chat':
      providerId = config.chatModel.providerId;
      break;
    case 'image':
      providerId = config.imageModel.providerId;
      break;
    case 'video':
      providerId = config.videoModel.providerId;
      break;
    default:
      providerId = 'gemini';
  }
  
  const provider = getProviderById(providerId) || getDefaultProvider();
  return provider.baseUrl.replace(/\/+$/, '');
};

/**
 * Lấy API Key của nhà cung cấp (nếu có Key riêng thì sử dụng, nếu không thì trả về undefined)
 */
export const getProviderApiKey = (providerId: string): string | undefined => {
  const provider = getProviderById(providerId);
  return provider?.apiKey;
};

/**
 * Lấy tỷ lệ khung hình mặc định
 */
export const getDefaultAspectRatio = (): AspectRatio => {
  return loadModelConfig().defaultAspectRatio;
};

/**
 * Đặt tỷ lệ khung hình mặc định
 */
export const setDefaultAspectRatio = (ratio: AspectRatio): void => {
  const state = loadModelConfig();
  state.defaultAspectRatio = ratio;
  saveModelConfig(state);
};

/**
 * Lấy thời lượng video mặc định
 */
export const getDefaultVideoDuration = (): VideoDuration => {
  return loadModelConfig().defaultVideoDuration;
};

/**
 * Đặt thời lượng video mặc định
 */
export const setDefaultVideoDuration = (duration: VideoDuration): void => {
  const state = loadModelConfig();
  state.defaultVideoDuration = duration;
  saveModelConfig(state);
};

/**
 * Lấy loại mô hình video
 */
export const getVideoModelType = (): 'sora' | 'veo' => {
  return getCurrentConfig().videoModel.type;
};

/**
 * Lấy tên mô hình Veo dựa trên tỷ lệ khung hình
 * @param hasReferenceImage có ảnh tham khảo hay không
 * @param aspectRatio tỷ lệ khung hình
 */
export const getVeoModelName = (hasReferenceImage: boolean, aspectRatio: AspectRatio): string => {
  const orientation = aspectRatio === '9:16' ? 'portrait' : 'landscape';
  
  if (hasReferenceImage) {
    return `veo_3_1_i2v_s_fast_fl_${orientation}`;
  } else {
    return `veo_3_1_t2v_fast_${orientation}`;
  }
};

/**
 * Lấy kích thước video Sora dựa trên tỷ lệ khung hình
 */
export const getSoraVideoSize = (aspectRatio: AspectRatio): string => {
  const sizeMap: Record<AspectRatio, string> = {
    '16:9': '1280x720',
    '9:16': '720x1280',
    '1:1': '720x720'
  };
  return sizeMap[aspectRatio];
};

/**
 * Đặt lại cấu hình mặc định
 */
export const resetToDefault = (): void => {
  runtimeState = null;
  localStorage.removeItem(STORAGE_KEY);
  loadModelConfig(); // Tải lại giá trị mặc định
};

/**
 * Danh sách mô hình đối thoại được xác định trước
 */
export const AVAILABLE_CHAT_MODELS = [
  { name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash', description: 'Nhanh, tối ưu cho cắt kịch bản' },
  { name: 'Gemini 2.0 Pro', value: 'gemini-2.0-pro-exp', description: 'Mạnh mẽ, sáng tạo cao' },
];

export const AVAILABLE_IMAGE_MODELS = [
  { name: 'Gemini 2.5 Flash Image', value: 'gemini-2.5-flash-image', description: 'Mô hình tạo ảnh Gemini 2.5 Flash từ Google' },
];

export const AVAILABLE_VIDEO_MODELS = [
  { name: 'Veo 3.1 Flash', value: 'veo_3_1-fast', type: 'veo' as const, description: 'Tạo video nhanh từ Google, hỗ trợ I2V và T2V' },
  { name: 'Veo 2', value: 'veo-2', type: 'veo' as const, description: 'Tạo video chuyên nghiệp từ Google' },
];
