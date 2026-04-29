/**
 * Model Abstraction Layer Types
 * Defines all types related to model registration, configuration, and adapters
 */

// ============================================
// Basic Types
// ============================================

/**
 * Model Type
 */
export type ModelType = 'chat' | 'image' | 'video';

/**
 * Aspect Ratio Type
 */
export type AspectRatio = '16:9' | '9:16' | '1:1';

/**
 * Video Duration Type (Async video mode only)
 */
export type VideoDuration = 4 | 5 | 8 | 10 | 12 | 15;

/**
 * Video Generation Mode
 */
export type VideoMode = 'sync' | 'async';

// ============================================
// Model Parameters
// ============================================

/**
 * Chat Model Parameters
 */
export interface ChatModelParams {
  temperature: number;           // 0-2, default 0.7
  maxTokens?: number;            // empty for no limit
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Image Model Parameters
 */
export interface ImageModelParams {
  defaultAspectRatio: AspectRatio;
  supportedAspectRatios: AspectRatio[];
}

/**
 * Video Model Parameters
 */
export interface VideoModelParams {
  mode: VideoMode;                        // sync=Veo, async=Sora
  defaultAspectRatio: AspectRatio;
  supportedAspectRatios: AspectRatio[];
  defaultDuration: VideoDuration;
  supportedDurations: VideoDuration[];
}

/**
 * Model Parameters Union Type
 */
export type ModelParams = ChatModelParams | ImageModelParams | VideoModelParams;

// ============================================
// Model Definitions
// ============================================

/**
 * Model Definition Base Interface
 */
export interface ModelDefinitionBase {
  id: string;                    // unique 'gpt-5.1'
  apiModel?: string;             // physical model name
  name: string;                  // display name
  type: ModelType;               // model type
  providerId: string;            // provider ID
  endpoint?: string;             // optional endpoint override
  description?: string;          // description
  isBuiltIn: boolean;            // whether built-in
  isEnabled: boolean;            // whether enabled
  apiKey?: string;               // model-level api key
}

/**
 * Chat Model Definition
 */
export interface ChatModelDefinition extends ModelDefinitionBase {
  type: 'chat';
  params: ChatModelParams;
}

/**
 * Image Model Definition
 */
export interface ImageModelDefinition extends ModelDefinitionBase {
  type: 'image';
  params: ImageModelParams;
}

/**
 * Video Model Definition
 */
export interface VideoModelDefinition extends ModelDefinitionBase {
  type: 'video';
  params: VideoModelParams;
}

/**
 * Model Definition Union Type
 */
export type ModelDefinition = ChatModelDefinition | ImageModelDefinition | VideoModelDefinition;

// ============================================
// Provider Definition
// ============================================

/**
 * Model Provider Config
 */
export interface ModelProvider {
  id: string;                    // unique
  name: string;                  // display
  baseUrl: string;               // API base url
  apiKey?: string;               // provider-level key
  isBuiltIn: boolean;            // whether built-in
  isDefault: boolean;            // whether default
}

// ============================================
// Registry State
// ============================================

/**
 * Active Models Config
 */
export interface ActiveModels {
  chat: string;
  image: string;
  video: string;
}

/**
 * Registry State
 */
export interface ModelRegistryState {
  providers: ModelProvider[];
  models: ModelDefinition[];
  activeModels: ActiveModels;
  globalApiKey?: string;
}

// ============================================
// Service Options
// ============================================

export interface ChatOptions {
  prompt: string;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json';
  timeout?: number;
  overrideParams?: Partial<ChatModelParams>;
}

export interface ImageGenerateOptions {
  prompt: string;
  referenceImages?: string[];
  aspectRatio?: AspectRatio;
}

export interface VideoGenerateOptions {
  prompt: string;
  startImage?: string;
  endImage?: string;
  aspectRatio?: AspectRatio;
  duration?: VideoDuration;
}

// ============================================
// Defaults
// ============================================

export const DEFAULT_CHAT_PARAMS: ChatModelParams = {
  temperature: 0.7,
  maxTokens: undefined,
};

export const DEFAULT_IMAGE_PARAMS: ImageModelParams = {
  defaultAspectRatio: '16:9',
  supportedAspectRatios: ['16:9', '9:16'],
};

export const DEFAULT_VIDEO_PARAMS_VEO: VideoModelParams = {
  mode: 'sync',
  defaultAspectRatio: '16:9',
  supportedAspectRatios: ['16:9', '9:16'],
  defaultDuration: 8,
  supportedDurations: [8],
};

export const DEFAULT_VIDEO_PARAMS_SORA: VideoModelParams = {
  mode: 'async',
  defaultAspectRatio: '16:9',
  supportedAspectRatios: ['16:9', '9:16', '1:1'],
  defaultDuration: 8,
  supportedDurations: [4, 8, 12],
};

export const DEFAULT_VIDEO_PARAMS_VEO_FAST: VideoModelParams = {
  mode: 'async',
  defaultAspectRatio: '16:9',
  supportedAspectRatios: ['16:9', '9:16'],
  defaultDuration: 8,
  supportedDurations: [8],
};

export const DEFAULT_VIDEO_PARAMS_DOUBAO_SEEDANCE: VideoModelParams = {
  mode: 'async',
  defaultAspectRatio: '16:9',
  supportedAspectRatios: ['16:9', '9:16'],
  defaultDuration: 5,
  supportedDurations: [5, 10, 15],
};

// ============================================
// Built-in Model Definitions
// ============================================

export const BUILTIN_CHAT_MODELS: ChatModelDefinition[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    type: 'chat',
    providerId: 'gemini',
    description: 'Mô hình Gemini 2.0 Flash tốc độ cao từ Google AI Studio, tối ưu cho việc cắt kịch bản và phân cảnh.',
    isBuiltIn: true,
    isEnabled: true,
    params: { ...DEFAULT_CHAT_PARAMS },
  },
  {
    id: 'gemini-2.0-pro-exp',
    name: 'Gemini 2.0 Pro Experimental',
    type: 'chat',
    providerId: 'gemini',
    description: 'Mô hình Gemini 2.0 Pro mạnh mẽ nhất, phù hợp cho các kịch bản phức tạp và sáng tạo cao.',
    isBuiltIn: true,
    isEnabled: true,
    params: { ...DEFAULT_CHAT_PARAMS },
  },
];

export const BUILTIN_IMAGE_MODELS: ImageModelDefinition[] = [
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    type: 'image',
    providerId: 'gemini',
    endpoint: '/v1beta/models/gemini-2.5-flash-image:generateContent',
    description: 'Mô hình tạo ảnh Gemini 2.5 Flash từ Google.',
    isBuiltIn: true,
    isEnabled: true,
    params: { ...DEFAULT_IMAGE_PARAMS, supportedAspectRatios: ['1:1', '16:9', '9:16'] },
  },
];

export const BUILTIN_VIDEO_MODELS: VideoModelDefinition[] = [
  {
    id: 'veo-2',
    name: 'Google Veo 2',
    type: 'video',
    providerId: 'gemini',
    endpoint: '/v1beta/models/veo-2:generateVideo',
    description: 'Mô hình tạo video chuyên nghiệp từ Google, hỗ trợ độ phân giải cao và chuyển động mượt mà.',
    isBuiltIn: true,
    isEnabled: false,
    params: { ...DEFAULT_VIDEO_PARAMS_VEO_FAST },
  },
  {
    id: 'veo_3_1-fast',
    name: 'Veo 3.1 Flash',
    type: 'video',
    providerId: 'gemini',
    endpoint: '/v1beta/models/veo_3_1_i2v_s_fast_fl_landscape:predictLongRunning',
    description: 'Veo 3.1 Flash từ Google — tạo video nhanh, hỗ trợ image-to-video và text-to-video.',
    isBuiltIn: true,
    isEnabled: true,
    params: { ...DEFAULT_VIDEO_PARAMS_VEO_FAST },
  },
];

export const BUILTIN_PROVIDERS: ModelProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (AI Studio)',
    baseUrl: 'https://generativelanguage.googleapis.com',
    isBuiltIn: true,
    isDefault: true,
  },
];

export const ALL_BUILTIN_MODELS: ModelDefinition[] = [
  ...BUILTIN_CHAT_MODELS,
  ...BUILTIN_IMAGE_MODELS,
  ...BUILTIN_VIDEO_MODELS,
];

export const DEFAULT_ACTIVE_MODELS: ActiveModels = {
  chat: 'gemini-2.0-flash',
  image: 'gemini-2.5-flash-image',
  video: 'veo_3_1-fast',
};
