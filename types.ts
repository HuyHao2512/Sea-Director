export interface CharacterVariation {
  id: string;
  name: string; // e.g., "Casual", "Tactical Gear", "Injured"
  visualPrompt: string;
  promptVersions?: PromptVersion[]; // Prompt edit history with rollback support
  negativePrompt?: string; // Prompt phủ định, dùng để loại trừ các yếu tố không mong muốn
  referenceImage?: string; // Ảnh tham khảo biến thể nhân vật, lưu dưới dạng base64 (data:image/png;base64,...)
  status?: 'pending' | 'generating' | 'completed' | 'failed'; // Trạng thái tạo, dùng để lưu trữ bền vững trạng thái loading
}

export type PromptVersionSource = 'ai-generated' | 'manual-edit' | 'rollback' | 'imported' | 'system';

export interface PromptVersion {
  id: string;
  prompt: string;
  createdAt: number;
  source: PromptVersionSource;
  note?: string;
}

/**
 * Cấu hình template prompt giai đoạn phân cảnh (có thể chỉnh sửa)
 */
export interface StoryboardPromptTemplateConfig {
  shotGeneration: string;
  shotRepair: string;
}

/**
 * Cấu hình template prompt khung hình đầu/cuối (có thể chỉnh sửa)
 */
export interface KeyframePromptTemplateConfig {
  startFrameGuide: string;
  endFrameGuide: string;
  characterConsistencyGuide: string;
  propWithImageGuide: string;
  propWithoutImageGuide: string;
  nineGridSourceMeta: string;
}

/**
 * Cấu hình template prompt phân cảnh lưới (có thể chỉnh sửa)
 */
export interface NineGridPromptTemplateConfig {
  splitSystem: string;
  splitUser: string;
  imagePrefix: string;
  imagePanelTemplate: string;
  imageSuffix: string;
}

/**
 * Cấu hình template prompt tạo video (có thể chỉnh sửa)
 */
export interface VideoPromptTemplateConfig {
  sora2Chinese: string;
  sora2English: string;
  sora2NineGridChinese: string;
  sora2NineGridEnglish: string;
  veoStartOnly: string;
  veoStartEnd: string;
}

/**
 * Tập hợp template prompt có thể chỉnh sửa của dự án hiện tại
 */
export interface PromptTemplateConfig {
  storyboard: StoryboardPromptTemplateConfig;
  keyframe: KeyframePromptTemplateConfig;
  nineGrid: NineGridPromptTemplateConfig;
  video: VideoPromptTemplateConfig;
}

/**
 * Cấu hình ghi đè template (chỉ lưu các thay đổi của người dùng)
 */
export interface PromptTemplateOverrides {
  storyboard?: Partial<StoryboardPromptTemplateConfig>;
  keyframe?: Partial<KeyframePromptTemplateConfig>;
  nineGrid?: Partial<NineGridPromptTemplateConfig>;
  video?: Partial<VideoPromptTemplateConfig>;
}

export interface QualityCheck {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number; // Weight percentage in total score
  passed: boolean;
  details?: string;
}

export interface ShotQualityAssessment {
  version: number; // Quality scoring schema version
  score: number; // 0-100
  grade: 'pass' | 'warning' | 'fail';
  generatedAt: number;
  checks: QualityCheck[];
  summary: string;
}

/**
 * Thiết kế trang phục nhân vật dạng lưới chín ô - dữ liệu panel từng góc nhìn
 * Dùng để hiển thị ngoại hình nhân vật từ nhiều góc độ, tăng tính nhất quán nhân vật khi tạo ảnh cảnh quay
 */
export interface CharacterTurnaroundPanel {
  index: number;           // 0-8, chỉ số vị trí trong lưới chín ô
  viewAngle: string;       // Góc nhìn: chính diện/trái/phải/sau/3/4 trái/3/4 phải/nhìn từ trên/nhìn từ dưới, v.v.
  shotSize: string;        // Cỡ cảnh: toàn thân/nửa người/cận cảnh, v.v.
  description: string;     // Mô tả hình ảnh của ô này
}

/**
 * Dữ liệu thiết kế trang phục nhân vật dạng lưới chín ô
 * Cung cấp ảnh tham khảo nhiều góc nhìn của nhân vật, dùng để khớp tham chiếu tốt nhất theo góc cảnh quay khi tạo phân cảnh
 */
export interface CharacterTurnaroundData {
  panels: CharacterTurnaroundPanel[];  // Dữ liệu mô tả 9 ô
  imageUrl?: string;                    // Ảnh lưới chín ô đã tạo (base64), dùng trực tiếp làm ảnh tham khảo nhiều góc nhìn
  prompt?: string;                      // Prompt đầy đủ dùng khi tạo
  status: 'pending' | 'generating_panels' | 'panels_ready' | 'generating_image' | 'completed' | 'failed';
  // generating_panels: AI đang tạo mô tả 9 góc nhìn
  // panels_ready: Mô tả góc nhìn đã tạo xong, chờ người dùng xác nhận/chỉnh sửa trước khi tạo ảnh
  // generating_image: Người dùng đã xác nhận, đang tạo ảnh lưới chín ô
}

export interface Character {
  id: string;
  name: string;
  gender: string;
  age: string;
  personality: string;
  visualPrompt?: string;
  promptVersions?: PromptVersion[]; // Prompt edit history with rollback support
  negativePrompt?: string;
  coreFeatures?: string;
  referenceImage?: string;
  turnaround?: CharacterTurnaroundData;
  variations: CharacterVariation[];
  status?: 'pending' | 'generating' | 'completed' | 'failed';
  libraryId?: string;
  libraryVersion?: number;
  version?: number;
}

export interface Scene {
  id: string;
  location: string;
  time: string;
  atmosphere: string;
  visualPrompt?: string;
  promptVersions?: PromptVersion[]; // Prompt edit history with rollback support
  negativePrompt?: string; // Prompt phủ định, dùng để loại trừ các yếu tố không mong muốn
  referenceImage?: string; // Ảnh tham khảo bối cảnh, lưu dưới dạng base64 (data:image/png;base64,...)
  status?: 'pending' | 'generating' | 'completed' | 'failed'; // Trạng thái tạo, dùng để lưu trữ bền vững trạng thái loading
  libraryId?: string;
  libraryVersion?: number;
  version?: number;
}

/**
 * Đạo cụ/vật phẩm - dùng để duy trì tính nhất quán hình ảnh vật phẩm giữa các phân cảnh
 * Ví dụ: bản đồ sao, vũ khí, bản đồ, thư từ, v.v. — các vật phẩm cần xuất hiện lặp lại trong nhiều cảnh quay
 */
export interface Prop {
  id: string;
  name: string;           // Tên đạo cụ, ví dụ "Bản đồ sao", "Cổ kiếm"
  category: string;       // Phân loại: vũ khí, tài liệu/thư từ, thức ăn/đồ uống, phương tiện, đồ trang trí, thiết bị công nghệ, khác
  description: string;    // Mô tả đạo cụ
  visualPrompt?: string;  // Prompt hình ảnh
  promptVersions?: PromptVersion[]; // Prompt edit history with rollback support
  negativePrompt?: string; // Prompt phủ định, dùng để loại trừ các yếu tố không mong muốn
  referenceImage?: string; // Ảnh tham khảo đạo cụ, lưu dưới dạng base64 (data:image/png;base64,...)
  status?: 'pending' | 'generating' | 'completed' | 'failed'; // Trạng thái tạo, dùng để lưu trữ bền vững trạng thái loading
  libraryId?: string;
  libraryVersion?: number;
  version?: number;
}

export type AssetLibraryItemType = 'character' | 'scene' | 'prop';

export interface AssetLibraryItem {
  id: string;
  type: AssetLibraryItemType;
  name: string;
  projectId?: string;
  projectName?: string;
  createdAt: number;
  updatedAt: number;
  data: Character | Scene | Prop;
}

export interface Keyframe {
  id: string;
  type: 'start' | 'end';
  visualPrompt: string;
  promptVersions?: PromptVersion[]; // Prompt edit history with rollback support
  imageUrl?: string; // Ảnh keyframe, lưu dưới dạng base64 (data:image/png;base64,...)
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface VideoInterval {
  id: string;
  startKeyframeId: string;
  endKeyframeId: string;
  duration: number;
  motionStrength: number;
  videoUrl?: string; // Dữ liệu video, lưu dưới dạng base64 (data:video/mp4;base64,...), tránh vấn đề URL hết hạn
  videoPrompt?: string; // Prompt dùng khi tạo video
  promptVersions?: PromptVersion[]; // Prompt edit history with rollback support
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

/**
 * Số lượng panel lưới phân cảnh (Bàn Đạo Diễn)
 */
export type StoryboardGridPanelCount = 4 | 6 | 9;

/**
 * Thông tin meta bố cục lưới phân cảnh
 */
export interface StoryboardGridLayoutMeta {
  panelCount: StoryboardGridPanelCount;
  rows: number;
  cols: number;
}

/**
 * Phân cảnh lưới chín ô - dữ liệu panel đơn lẻ
 */
export interface NineGridPanel {
  index: number;           // 0-(panelCount-1), chỉ số vị trí trong lưới
  shotSize: string;        // Cỡ cảnh: cận cảnh/cảnh gần/cảnh trung/cảnh toàn/cảnh xa, v.v.
  cameraAngle: string;     // Góc máy quay: nhìn từ trên/nhìn từ dưới/ngang/nghiêng, v.v.
  description: string;     // Mô tả hình ảnh của ô này
}

/**
 * Dữ liệu phân cảnh lưới chín ô
 */
export interface NineGridData {
  panels: NineGridPanel[];  // Dữ liệu mô tả các ô lưới
  layout?: StoryboardGridLayoutMeta; // Bố cục lưới hiện tại (4/6/9)
  imageUrl?: string;        // Ảnh lưới đã tạo (base64)
  prompt?: string;          // Prompt đầy đủ dùng khi tạo
  status: 'pending' | 'generating_panels' | 'panels_ready' | 'generating_image' | 'completed' | 'failed';
  // generating_panels: AI đang tạo mô tả cảnh quay trong lưới
  // panels_ready: Mô tả cảnh quay đã tạo xong, chờ người dùng xác nhận/chỉnh sửa trước khi tạo ảnh
  // generating_image: Người dùng đã xác nhận, đang tạo ảnh lưới
}

export interface Shot {
  id: string;
  sceneId: string;
  actionSummary: string;
  dialogue?: string; 
  cameraMovement: string;
  shotSize?: string; 
  characters: string[]; // Character IDs
  characterVariations?: { [characterId: string]: string }; // Added: Map char ID to variation ID for this shot
  props?: string[]; // Mảng ID đạo cụ, tham chiếu đến các đạo cụ trong ScriptData.props
  keyframes: Keyframe[];
  interval?: VideoInterval;
  qualityAssessment?: ShotQualityAssessment;
  videoModel?: 'veo' | 'sora-2' | 'veo_3_1-fast' | 'veo_3_1-fast-4K' | 'veo_3_1_t2v_fast_landscape' | 'veo_3_1_t2v_fast_portrait' | 'veo_3_1_i2v_s_fast_fl_landscape' | 'veo_3_1_i2v_s_fast_fl_portrait' | 'doubao-seedance-1-5-pro-251215' | 'doubao-seedance-2-0-260128'; // Video generation model selection
  videoInputMode?: 'keyframes' | 'storyboard-grid'; // Phương thức điều khiển video: khung hình đầu/cuối / phân cảnh lưới (loại trừ nhau)
  nineGrid?: NineGridData; // Dữ liệu phân cảnh lưới chín ô tùy chọn (tính năng nâng cao)
}

/**
 * Tài liệu chỉ đạo nghệ thuật toàn cục - dùng để thống nhất phong cách hình ảnh cho tất cả nhân vật và bối cảnh
 * Trước khi tạo bất kỳ prompt nhân vật/bối cảnh nào, AI sẽ tạo tài liệu này dựa trên nội dung kịch bản,
 * tất cả các prompt hình ảnh tiếp theo đều bị ràng buộc bởi tài liệu này để đảm bảo tính nhất quán phong cách.
 */
export interface ArtDirection {
  /** Bảng màu toàn cục */
  colorPalette: {
    primary: string;      // Mô tả màu chủ đạo
    secondary: string;    // Màu phụ
    accent: string;       // Màu điểm nhấn
    skinTones: string;    // Mô tả dải màu da
    saturation: string;   // Xu hướng độ bão hòa tổng thể
    temperature: string;  // Xu hướng nhiệt độ màu tổng thể
  };
  /** Quy tắc thiết kế nhân vật thống nhất */
  characterDesignRules: {
    proportions: string;   // Tỷ lệ đầu/thân, phong cách vóc dáng
    eyeStyle: string;      // Phong cách vẽ mắt thống nhất
    lineWeight: string;    // Phong cách độ dày nét vẽ
    detailLevel: string;   // Mức độ chi tiết
  };
  /** Phong cách xử lý ánh sáng và bóng thống nhất */
  lightingStyle: string;
  /** Phong cách chất liệu/kết cấu */
  textureStyle: string;
  /** 3-5 từ khóa phong cách cốt lõi */
  moodKeywords: string[];
  /** Đoạn mô tả neo phong cách thống nhất, được chèn vào khi tạo tất cả prompt */
  consistencyAnchors: string;
}

export interface ScriptData {
  title: string;
  genre: string;
  logline: string;
  targetDuration?: string;
  language?: string;
  visualStyle?: string; // Visual style: live-action, anime, 3d-animation, etc.
  shotGenerationModel?: string; // Model used for shot generation
  planningShotDuration?: number; // Locked shot duration baseline (seconds) used for shot count planning
  artDirection?: ArtDirection; // Tài liệu chỉ đạo nghệ thuật toàn cục, dùng để thống nhất phong cách hình ảnh nhân vật và bối cảnh
  characters: Character[];
  scenes: Scene[];
  props: Prop[]; // Danh sách đạo cụ, dùng để duy trì tính nhất quán hình ảnh vật phẩm giữa các phân cảnh
  storyParagraphs: { id: number; text: string; sceneRefId: string }[];
  generationMeta?: {
    // Fingerprint of raw script + language (structure extraction inputs).
    structureKey?: string;
    // Fingerprint of structure + style/model/language (visual enrichment inputs).
    visualsKey?: string;
    // Fingerprint of visualized script + duration/model (shot generation inputs).
    shotsKey?: string;
    generatedAt?: number;
  };
}

export interface RenderLog {
  id: string;
  timestamp: number; // Unix timestamp when API was called
  type: 'character' | 'character-variation' | 'scene' | 'prop' | 'keyframe' | 'video' | 'script-parsing';
  resourceId: string; // ID of the resource being generated
  resourceName: string; // Human-readable name
  status: 'success' | 'failed';
  model: string; // Model used (e.g., 'imagen-3', 'veo_3_1_i2v_s_fast_fl_landscape', 'gpt-41')
  prompt?: string; // The prompt used (optional, for debugging)
  error?: string; // Error message if failed
  inputTokens?: number; // Input tokens consumed
  outputTokens?: number; // Output tokens generated
  totalTokens?: number; // Total tokens (if available from API)
  duration?: number; // Time taken in milliseconds
}

export interface SeriesProject {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  createdAt: number;
  lastModified: number;
  visualStyle: string;
  language: string;
  artDirection?: ArtDirection;
  characterLibrary: Character[];
  sceneLibrary: Scene[];
  propLibrary: Prop[];
}

export interface Series {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  sortOrder: number;
  createdAt: number;
  lastModified: number;
}

export type AssetSyncStatus = 'synced' | 'outdated' | 'local-only';

export interface EpisodeCharacterRef {
  characterId: string;
  syncedVersion: number;
  syncStatus: AssetSyncStatus;
}

export interface EpisodeSceneRef {
  sceneId: string;
  syncedVersion: number;
  syncStatus: AssetSyncStatus;
}

export interface EpisodePropRef {
  propId: string;
  syncedVersion: number;
  syncStatus: AssetSyncStatus;
}

export type ScriptGenerationStep = 'structure' | 'visuals' | 'shots';

export interface ScriptGenerationCheckpoint {
  // Next step to execute in the analyze pipeline.
  step: ScriptGenerationStep;
  // Hash of script/config inputs so stale checkpoints can be invalidated.
  configKey: string;
  // Latest successful intermediate result for resume.
  scriptData?: ScriptData | null;
  updatedAt: number;
}

export interface Episode {
  id: string;
  projectId: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  createdAt: number;
  lastModified: number;
  stage: 'script' | 'assets' | 'director' | 'export' | 'prompts';
  rawScript: string;
  targetDuration: string;
  language: string;
  visualStyle: string;
  shotGenerationModel: string;
  scriptData: ScriptData | null;
  shots: Shot[];
  isParsingScript: boolean;
  renderLogs: RenderLog[];
  characterRefs: EpisodeCharacterRef[];
  sceneRefs: EpisodeSceneRef[];
  propRefs: EpisodePropRef[];
  promptTemplateOverrides?: PromptTemplateOverrides;
  scriptGenerationCheckpoint?: ScriptGenerationCheckpoint | null;
}

export type ProjectState = Episode;

// ============================================
// Định nghĩa kiểu dữ liệu quản lý model
// ============================================

/**
 * Kiểu tỷ lệ khung hình ngang/dọc
 * - 16:9: Ngang (mặc định)
 * - 9:16: Dọc
 * - 1:1: Vuông
 */
export type AspectRatio = '16:9' | '9:16' | '1:1';

/**
 * Kiểu thời lượng video (chỉ hỗ trợ với model video bất đồng bộ)
 */
export type VideoDuration = 4 | 5 | 8 | 10 | 12 | 15;

/**
 * Cấu hình nhà cung cấp model
 */
export interface ModelProvider {
  id: string;
  name: string;
  baseUrl: string;  // URL cơ sở của API, ví dụ 'https://api.example.com'
  apiKey?: string;  // API Key riêng tùy chọn (nếu không đặt thì dùng API Key toàn cục)
  isDefault?: boolean;  // Có phải nhà cung cấp mặc định không
  isBuiltIn?: boolean;  // Có phải nhà cung cấp tích hợp sẵn không (không thể xóa)
}

/**
 * Cấu hình model hội thoại
 */
export interface ChatModelConfig {
  providerId: string;
  modelName: string;  // Ví dụ 'gpt-5.1', 'gpt-41', 'gpt-5.2'
  endpoint?: string;  // Endpoint API, mặc định là '/v1/chat/completions'
}

/**
 * Cấu hình model tạo ảnh
 */
export interface ImageModelConfig {
  providerId: string;
  modelName: string;  // Ví dụ 'gemini-3-pro-image-preview'
  endpoint?: string;  // Endpoint API, mặc định là '/v1beta/models/{modelName}:generateContent'
}

/**
 * Cấu hình model video
 */
export interface VideoModelConfig {
  providerId: string;
  type: 'sora' | 'veo';  // sora dùng API bất đồng bộ, veo dùng API đồng bộ
  modelName: string;  // Tên model cơ sở, ví dụ 'sora-2', 'veo_3_1-fast'
  endpoint?: string;  // Endpoint API
}

/**
 * Cấu hình model đầy đủ
 */
export interface ModelConfig {
  chatModel: ChatModelConfig;
  imageModel: ImageModelConfig;
  videoModel: VideoModelConfig;
}

/**
 * Trạng thái toàn cục quản lý model
 */
export interface ModelManagerState {
  providers: ModelProvider[];
  currentConfig: ModelConfig;
  defaultAspectRatio: AspectRatio;
  defaultVideoDuration: VideoDuration;
}
