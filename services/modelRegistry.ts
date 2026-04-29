/**
 * Trung tâm đăng ký mô hình
 * Quản lý tất cả các mô hình đã đăng ký, cung cấp các hoạt động CRUD
 */

import {
  ModelType,
  ModelDefinition,
  ModelProvider,
  ModelRegistryState,
  ActiveModels,
  ChatModelDefinition,
  ImageModelDefinition,
  VideoModelDefinition,
  BUILTIN_PROVIDERS,
  ALL_BUILTIN_MODELS,
  DEFAULT_ACTIVE_MODELS,
  AspectRatio,
  VideoDuration,
} from '../types/model';

// Khóa localStorage
const STORAGE_KEY = 'aidirector_model_registry';
const API_KEY_STORAGE_KEY = 'gemini_api_key';

// Chuẩn hóa URL (xóa dấu gạch chéo ở cuối, chuyển thành chữ thường) để loại bỏ trùng lặp
const normalizeBaseUrl = (url: string): string => url.trim().replace(/\/+$/, '').toLowerCase();

// Bộ nhớ đệm trạng thái thời gian chạy
let registryState: ModelRegistryState | null = null;

// ============================================
// Quản lý trạng thái
// ============================================

/**
 * Lấy trạng thái mặc định
 */
const getDefaultState = (): ModelRegistryState => {
  const envApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
  const storedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  
  // Use environment defaults if present
  const defaultActiveModels: ActiveModels = {
    chat: import.meta.env.VITE_DEFAULT_CHAT_MODEL || DEFAULT_ACTIVE_MODELS.chat,
    image: import.meta.env.VITE_DEFAULT_IMAGE_MODEL || DEFAULT_ACTIVE_MODELS.image,
    video: import.meta.env.VITE_DEFAULT_VIDEO_MODEL || DEFAULT_ACTIVE_MODELS.video,
  };
  
  // Create providers with environment API key if applicable
  const providers = BUILTIN_PROVIDERS.map(p => {
    if (p.id === 'gemini' && envApiKey) {
      return { ...p, apiKey: envApiKey };
    }
    return p;
  });

  return {
    providers,
    models: [...ALL_BUILTIN_MODELS],
    activeModels: defaultActiveModels,
    globalApiKey: storedApiKey || envApiKey || undefined,
  };
};

/**
 * Tải trạng thái từ localStorage
 */
export const loadRegistry = (): ModelRegistryState => {
  if (registryState) {
    return registryState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ModelRegistryState;
      
      // Force reset nếu active image model là imagen-3 (không hỗ trợ)
      if (parsed.activeModels?.image === 'imagen-3') {
        console.warn('⚠️ Phát hiện imagen-3 trong localStorage, đang reset về gemini-2.5-flash-image...');
        parsed.activeModels.image = 'gemini-2.5-flash-image';
        // Xóa model imagen-3 khỏi danh sách
        parsed.models = parsed.models.filter(m => !(m.type === 'image' && m.id === 'imagen-3'));
      }
      
      const deprecatedVideoModelIds = [
        'veo-3.1',
        'veo-r2v',
        'veo_3_0_r2v_fast_portrait',
        'veo_3_0_r2v_fast_landscape',
        'veo_3_1_t2v_fast_landscape',
        'veo_3_1_t2v_fast_portrait',
        'veo_3_1_i2v_s_fast_fl_landscape',
        'veo_3_1_i2v_s_fast_fl_portrait',
      ];
      
      // Đảm bảo các mô hình và nhà cung cấp tích hợp luôn tồn tại
      const builtInProviderIds = BUILTIN_PROVIDERS.map(p => p.id);
      const builtInModelIds = ALL_BUILTIN_MODELS.map(m => m.id);
      
      // Hợp nhất các nhà cung cấp tích hợp
      const existingProviderIds = parsed.providers.map(p => p.id);
      BUILTIN_PROVIDERS.forEach(bp => {
        if (!existingProviderIds.includes(bp.id)) {
          parsed.providers.unshift(bp);
        }
      });

      // Loại bỏ trùng lặp nhà cung cấp theo baseUrl (giữ lại mục xuất hiện trước, thường là tích hợp)
      const seenBaseUrls = new Set<string>();
      parsed.providers = parsed.providers.filter(p => {
        const key = normalizeBaseUrl(p.baseUrl);
        if (seenBaseUrls.has(key)) return false;
        seenBaseUrls.add(key);
        return true;
      });
      
      // Hợp nhất các mô hình tích hợp và đảm bảo các tham số của mô hình tích hợp được đồng bộ với mã
      const existingModelIds = parsed.models.map(m => m.id);
      ALL_BUILTIN_MODELS.forEach(bm => {
        const existingIndex = parsed.models.findIndex(m => m.id === bm.id);
        if (existingIndex === -1) {
          // Mô hình tích hợp không tồn tại, thêm
          parsed.models.push(bm);
        } else {
          // Mô hình tích hợp đã tồn tại: dựa trên định nghĩa mã, giữ lại cài đặt cá nhân hóa của người dùng
          const existing = parsed.models[existingIndex];
          // Các tham số tùy chọn có thể điều chỉnh của người dùng (defaultAspectRatio, temperature, maxTokens, defaultDuration, v.v.)
          // Các tham số cấu trúc (supportedAspectRatios, supportedDurations, mode, v.v.) luôn được đồng bộ từ mã
          const USER_PREF_KEYS = ['defaultAspectRatio', 'temperature', 'maxTokens', 'defaultDuration'];
          const mergedParams = { ...(bm as any).params };
          const existingParams = (existing as any).params;
          if (existingParams) {
            for (const key of USER_PREF_KEYS) {
              if (key in existingParams && existingParams[key] !== undefined) {
                if (key === 'defaultDuration') {
                  const candidate = existingParams[key];
                  const supported = (mergedParams as any).supportedDurations;
                  if (Array.isArray(supported) && !supported.includes(candidate)) {
                    continue;
                  }
                }
                mergedParams[key] = existingParams[key];
              }
            }
          }
          parsed.models[existingIndex] = {
            ...bm,
            isEnabled: existing.isEnabled,
            // Giữ lại khóa API được cấu hình của người dùng ở cấp mô hình cho các mô hình tích hợp.
            apiKey: existing.apiKey?.trim() || undefined,
            params: mergedParams as any,
          };
        }
      });

      // Di chuyển apiModel bị thiếu (ưu tiên suy luận từ id hoặc tiền tố providerId)
      parsed.models = parsed.models.map(m => {
        if (m.apiModel) return m;
        if (m.providerId && m.id.startsWith(`${m.providerId}:`)) {
          return { ...m, apiModel: m.id.slice(m.providerId.length + 1) };
        }
        return { ...m, apiModel: m.id };
      });

      // Xóa các mô hình video cũ đã bị loại bỏ
      const modelCountBefore = parsed.models.length;
      parsed.models = parsed.models.filter(
        m => !(m.type === 'video' && deprecatedVideoModelIds.includes(m.id))
      );
      const modelsRemoved = modelCountBefore - parsed.models.length;

      // Di chuyển mô hình video hoạt động
      let activeModelMigrated = false;
      if (
        deprecatedVideoModelIds.includes(parsed.activeModels.video) ||
        parsed.activeModels.video === 'veo_3_1' ||
        parsed.activeModels.video?.startsWith('veo_3_1_') ||
        parsed.activeModels.video === 'veo-2'
      ) {
        parsed.activeModels.video = 'veo_3_1-fast';
        activeModelMigrated = true;
      }
      
      // Đồng bộ hóa khóa API toàn cục
      const envApiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
      parsed.globalApiKey = localStorage.getItem(API_KEY_STORAGE_KEY) || envApiKey || parsed.globalApiKey;
      
      // Ensure Gemini provider has API key (if declared in .env)
      const geminiProvider = parsed.providers.find(p => p.id === 'gemini');
      if (geminiProvider && !geminiProvider.apiKey && envApiKey) {
        geminiProvider.apiKey = envApiKey;
      }
      
      // Migration: Switch models if defaults in env suggest so
      const envChatModel = import.meta.env.VITE_DEFAULT_CHAT_MODEL;
      if (envChatModel && parsed.activeModels.chat !== envChatModel) {
        parsed.activeModels.chat = envChatModel;
        activeModelMigrated = true;
      }

      const envImageModel = import.meta.env.VITE_DEFAULT_IMAGE_MODEL;
      if (envImageModel && parsed.activeModels.image !== envImageModel) {
        parsed.activeModels.image = envImageModel;
        activeModelMigrated = true;
      }

      const envVideoModel = import.meta.env.VITE_DEFAULT_VIDEO_MODEL;
      if (envVideoModel && parsed.activeModels.video !== envVideoModel) {
        parsed.activeModels.video = envVideoModel;
        activeModelMigrated = true;
      }
      
      registryState = parsed;

      // Nếu xảy ra di chuyển, hãy ghi lại localStorage ngay để tránh thực hiện lặp lại mỗi lần tải
      if (modelsRemoved > 0 || activeModelMigrated) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          console.log(`🔄 Hoàn tất di chuyển trung tâm đăng ký mô hình: đã xóa ${modelsRemoved} mô hình bị loại bỏ`);
        } catch (e) {
          // Lỗi ghi lại không ảnh hưởng đến hoạt động, lần tải tiếp theo sẽ di chuyển lại
        }
      }

      return parsed;
    }
  } catch (e) {
    console.error('Không thể tải trung tâm đăng ký mô hình:', e);
  }

  registryState = getDefaultState();
  return registryState;
};

/**
 * Lưu trạng thái vào localStorage
 */
export const saveRegistry = (state: ModelRegistryState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    registryState = state;
  } catch (e) {
    console.error('Không thể lưu trung tâm đăng ký mô hình:', e);
  }
};

/**
 * Lấy trạng thái hiện tại
 */
export const getRegistryState = (): ModelRegistryState => {
  return loadRegistry();
};

/**
 * Đặt lại trạng thái mặc định
 */
export const resetRegistry = (): void => {
  registryState = null;
  localStorage.removeItem(STORAGE_KEY);
  loadRegistry();
};

// ============================================
// Quản lý nhà cung cấp
// ============================================

/**
 * Lấy tất cả các nhà cung cấp
 */
export const getProviders = (): ModelProvider[] => {
  return loadRegistry().providers;
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
  return getProviders().find(p => p.isDefault) || BUILTIN_PROVIDERS[0];
};

/**
 * Thêm nhà cung cấp
 */
export const addProvider = (provider: Omit<ModelProvider, 'id' | 'isBuiltIn'>): ModelProvider => {
  const state = loadRegistry();
  const normalized = normalizeBaseUrl(provider.baseUrl);
  const existing = state.providers.find(p => normalizeBaseUrl(p.baseUrl) === normalized);
  if (existing) return existing;
  const newProvider: ModelProvider = {
    ...provider,
    id: `provider_${Date.now()}`,
    isBuiltIn: false,
  };
  state.providers.push(newProvider);
  saveRegistry(state);
  return newProvider;
};

/**
 * Cập nhật nhà cung cấp
 */
export const updateProvider = (id: string, updates: Partial<ModelProvider>): boolean => {
  const state = loadRegistry();
  const index = state.providers.findIndex(p => p.id === id);
  if (index === -1) return false;

  // Các nhà cung cấp tích hợp không thể sửa đổi một số thuộc tính
  if (state.providers[index].isBuiltIn) {
    delete updates.id;
    delete updates.isBuiltIn;
    delete updates.baseUrl;
  }

  state.providers[index] = { ...state.providers[index], ...updates };
  saveRegistry(state);
  return true;
};

/**
 * Xóa nhà cung cấp
 */
export const removeProvider = (id: string): boolean => {
  const state = loadRegistry();
  const provider = state.providers.find(p => p.id === id);
  
  // Không thể xóa các nhà cung cấp tích hợp
  if (!provider || provider.isBuiltIn) return false;
  
  // Xóa tất cả các mô hình của nhà cung cấp này
  state.models = state.models.filter(m => m.providerId !== id);
  state.providers = state.providers.filter(p => p.id !== id);
  
  saveRegistry(state);
  return true;
};

// ============================================
// Quản lý mô hình
// ============================================

/**
 * Lấy tất cả các mô hình
 */
export const getModels = (type?: ModelType): ModelDefinition[] => {
  const models = loadRegistry().models;
  if (type) {
    return models.filter(m => m.type === type);
  }
  return models;
};

/**
 * Lấy danh sách mô hình đối thoại
 */
export const getChatModels = (): ChatModelDefinition[] => {
  return getModels('chat') as ChatModelDefinition[];
};

/**
 * Lấy danh sách mô hình hình ảnh
 */
export const getImageModels = (): ImageModelDefinition[] => {
  return getModels('image') as ImageModelDefinition[];
};

/**
 * Lấy danh sách mô hình video
 */
export const getVideoModels = (): VideoModelDefinition[] => {
  return getModels('video') as VideoModelDefinition[];
};

/**
 * Lấy mô hình theo ID
 */
export const getModelById = (id: string): ModelDefinition | undefined => {
  return getModels().find(m => m.id === id);
};

/**
 * Lấy mô hình hoạt động hiện tại
 */
export const getActiveModel = (type: ModelType): ModelDefinition | undefined => {
  const state = loadRegistry();
  const activeId = state.activeModels[type];
  return getModelById(activeId);
};

/**
 * Lấy mô hình đối thoại hoạt động hiện tại
 */
export const getActiveChatModel = (): ChatModelDefinition | undefined => {
  return getActiveModel('chat') as ChatModelDefinition | undefined;
};

/**
 * Lấy mô hình hình ảnh hoạt động hiện tại
 */
export const getActiveImageModel = (): ImageModelDefinition | undefined => {
  return getActiveModel('image') as ImageModelDefinition | undefined;
};

/**
 * Lấy mô hình video hoạt động hiện tại
 */
export const getActiveVideoModel = (): VideoModelDefinition | undefined => {
  return getActiveModel('video') as VideoModelDefinition | undefined;
};

/**
 * Đặt mô hình hoạt động
 */
export const setActiveModel = (type: ModelType, modelId: string): boolean => {
  const model = getModelById(modelId);
  if (!model || model.type !== type || !model.isEnabled) return false;

  const state = loadRegistry();
  state.activeModels[type] = modelId;
  saveRegistry(state);
  return true;
};

/**
 * Đăng ký mô hình mới
 * @param model - Định nghĩa mô hình (có thể chứa id tùy chỉnh, không chứa isBuiltIn)
 */
export const registerModel = (model: Omit<ModelDefinition, 'id' | 'isBuiltIn'> & { id?: string }): ModelDefinition => {
  const state = loadRegistry();
  
  const providedId = (model as any).id?.trim();
  const apiModel = (model as any).apiModel?.trim();
  const baseId = providedId || (apiModel ? `${model.providerId}:${apiModel}` : `model_${Date.now()}`);
  let modelId = baseId;

  // Nếu không cung cấp ID rõ ràng, hãy tự động tạo ID duy nhất (cho phép tên mô hình API trùng lặp)
  if (!providedId) {
    let suffix = 1;
    while (state.models.some(m => m.id === modelId)) {
      modelId = `${baseId}_${suffix++}`;
    }
  } else if (state.models.some(m => m.id === modelId)) {
    throw new Error(`ID mô hình "${modelId}" đã tồn tại, vui lòng sử dụng ID khác`);
  }
  
  const newModel = {
    ...model,
    id: modelId,
    apiModel: apiModel || (model.providerId && modelId.startsWith(`${model.providerId}:`)
      ? modelId.slice(model.providerId.length + 1)
      : modelId),
    isBuiltIn: false,
  } as ModelDefinition;
  
  state.models.push(newModel);
  saveRegistry(state);
  return newModel;
};

/**
 * Cập nhật mô hình
 */
export const updateModel = (id: string, updates: Partial<ModelDefinition>): boolean => {
  const state = loadRegistry();
  const index = state.models.findIndex(m => m.id === id);
  if (index === -1) return false;

  // Các mô hình tích hợp chỉ mở một số trường có thể chỉnh sửa:
  // - isEnabled: bật/tắt
  // - params: tùy chọn tham số (tỷ lệ, thời lượng, v.v.)
  // - apiKey: khóa riêng của mô hình (ghi đè toàn cục/Nhà cung cấp)
  if (state.models[index].isBuiltIn) {
    const allowedUpdates: Partial<ModelDefinition> = {};
    if (updates.isEnabled !== undefined) allowedUpdates.isEnabled = updates.isEnabled;
    if (updates.params) allowedUpdates.params = updates.params as any;
    if (updates.apiKey !== undefined) {
      allowedUpdates.apiKey = updates.apiKey?.trim() || undefined;
    }
    state.models[index] = { ...state.models[index], ...allowedUpdates } as ModelDefinition;
  } else {
    state.models[index] = { ...state.models[index], ...updates } as ModelDefinition;
  }

  saveRegistry(state);
  return true;
};

/**
 * Xóa mô hình
 */
export const removeModel = (id: string): boolean => {
  const state = loadRegistry();
  const model = state.models.find(m => m.id === id);
  
  // Không thể xóa các mô hình tích hợp
  if (!model || model.isBuiltIn) return false;
  
  // Nếu xóa mô hình đang hoạt động, hãy chuyển sang mô hình cùng loại đầu tiên được bật
  if (state.activeModels[model.type] === id) {
    const fallback = state.models.find(m => m.type === model.type && m.id !== id && m.isEnabled);
    if (fallback) {
      state.activeModels[model.type] = fallback.id;
    }
  }
  
  state.models = state.models.filter(m => m.id !== id);
  saveRegistry(state);
  return true;
};

/**
 * Bật/tắt mô hình
 */
export const toggleModelEnabled = (id: string, enabled: boolean): boolean => {
  return updateModel(id, { isEnabled: enabled });
};

// ============================================
// Quản lý API Key
// ============================================

/**
 * Lấy API Key toàn cục
 */
export const getGlobalApiKey = (): string | undefined => {
  return loadRegistry().globalApiKey || localStorage.getItem(API_KEY_STORAGE_KEY) || undefined;
};

/**
 * Đặt API Key toàn cục
 */
export const setGlobalApiKey = (apiKey: string): void => {
  const state = loadRegistry();
  state.globalApiKey = apiKey;
  localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  saveRegistry(state);
};

/**
 * Lấy API Key tương ứng với mô hình
 * Ưu tiên: Khóa riêng của mô hình > Khóa nhà cung cấp > Khóa toàn cục
 */
export const getApiKeyForModel = (modelId: string): string | undefined => {
  const model = getModelById(modelId);
  if (!model) return getGlobalApiKey();
  
  // 1. Ưu tiên sử dụng API Key riêng của mô hình
  if (model.apiKey) {
    return model.apiKey;
  }
  
  // 2. Tiếp theo sử dụng API Key của nhà cung cấp
  const provider = getProviderById(model.providerId);
  if (provider?.apiKey) {
    return provider.apiKey;
  }
  
  // 3. Cuối cùng sử dụng API Key toàn cục
  return getGlobalApiKey();
};

/**
 * Lấy URL cơ sở API tương ứng với mô hình
 */
export const getApiBaseUrlForModel = (modelId: string): string => {
  const model = getModelById(modelId);
  if (!model) return BUILTIN_PROVIDERS[0].baseUrl.replace(/\/+$/, '');
  
  const provider = getProviderById(model.providerId);
  const baseUrl = provider?.baseUrl || BUILTIN_PROVIDERS[0].baseUrl;
  return baseUrl.replace(/\/+$/, '');
};

// ============================================
// Các hàm trợ giúp
// ============================================

/**
 * Lấy cấu hình đầy đủ của mô hình hoạt động
 */
export const getActiveModelsConfig = (): ActiveModels => {
  return loadRegistry().activeModels;
};

/**
 * Kiểm tra xem mô hình có khả dụng không (đã bật và có API Key)
 */
export const isModelAvailable = (modelId: string): boolean => {
  const model = getModelById(modelId);
  if (!model || !model.isEnabled) return false;
  
  const apiKey = getApiKeyForModel(modelId);
  return !!apiKey;
};

// ============================================
// Các hàm trợ giúp giá trị mặc định (tương thích ngược)
// ============================================

/**
 * Lấy tỷ lệ khung hình mặc định (giá trị mặc định của mô hình)
 */
export const getDefaultAspectRatio = (): AspectRatio => {
  const imageModel = getActiveImageModel();
  if (imageModel) {
    return imageModel.params.defaultAspectRatio;
  }
  return '16:9';
};

/**
 * Lấy tỷ lệ khung hình do người dùng chọn
 * Đọc defaultAspectRatio của mô hình hình ảnh hoạt động hiện tại
 */
export const getUserAspectRatio = (): AspectRatio => {
  return getDefaultAspectRatio();
};

/**
 * Đặt tỷ lệ khung hình do người dùng chọn (đồng bộ cập nhật tỷ lệ mặc định của mô hình hình ảnh hoạt động hiện tại)
 * Các thay đổi sẽ được lưu trữ bền vững và giữ nhất quán với "Tỷ lệ mặc định" trên trang cấu hình mô hình
 */
export const setUserAspectRatio = (ratio: AspectRatio): void => {
  const activeModel = getActiveImageModel();
  if (activeModel) {
    updateModel(activeModel.id, {
      params: { ...activeModel.params, defaultAspectRatio: ratio }
    } as any);
  }
};

/**
 * Lấy thời lượng video mặc định
 */
export const getDefaultVideoDuration = (): VideoDuration => {
  const videoModel = getActiveVideoModel();
  if (videoModel) {
    return videoModel.params.defaultDuration;
  }
  return 8;
};

/**
 * Lấy loại mô hình video
 */
export const getVideoModelType = (): 'sora' | 'veo' => {
  const videoModel = getActiveVideoModel();
  if (videoModel) {
    return videoModel.params.mode === 'async' ? 'sora' : 'veo';
  }
  return 'sora';
};
