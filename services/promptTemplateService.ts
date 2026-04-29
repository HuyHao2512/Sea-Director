import type {
  PromptTemplateConfig,
  PromptTemplateOverrides,
} from '../types';

const CAMERA_MOVEMENT_REFERENCE = `- Horizontal Left Shot (di chuyển trái) - Camera moves left
- Horizontal Right Shot (di chuyển phải) - Camera moves right
- Pan Left Shot (quét trái song song) - Pan left
- Pan Right Shot (quét phải song song) - Pan right
- Vertical Up Shot (chuyển động thẳng lên) - Move up vertically
- Vertical Down Shot (chuyển động thẳng xuống) - Move down vertically
- Tilt Up Shot (chuyển động góc nhìn lên) - Tilt upward
- Tilt Down Shot (chuyển động góc nhìn xuống) - Tilt downward
- Zoom Out Shot (thu nhỏ ống kính/kéo xa) - Pull back/zoom out
- Zoom In Shot (phóng to ống kính/kéo gần) - Push in/zoom in
- Dolly Shot (đẩy ống kính) - Dolly in/out movement
- Circular Shot (quay quanh chủ thể) - Orbit around subject
- Over the Shoulder Shot (ống kính qua vai) - Over shoulder perspective
- Pan Shot (quét ống kính) - Pan movement
- Low Angle Shot (ống kính nhìn từ dưới) - Low angle view
- High Angle Shot (ống kính nhìn từ trên) - High angle view
- Tracking Shot (ống kính theo dõi) - Follow subject
- Handheld Shot (ống kính cầm tay) - Handheld camera
- Static Shot (ống kính tĩnh) - Fixed camera position
- POV Shot (góc nhìn chủ quan) - Point of view
- Bird's Eye View Shot (ống kính nhìn từ trên cao) - Overhead view
- 360-Degree Circular Shot (vòng quay 360 độ) - Full circle
- Parallel Tracking Shot (theo dõi song song) - Side tracking
- Diagonal Tracking Shot (theo dõi đường chéo) - Diagonal tracking
- Rotating Shot (ống kính xoay) - Rotating movement
- Slow Motion Shot (chuyển động chậm) - Slow-mo effect
- Time-Lapse Shot (chụp nhanh) - Time-lapse
- Canted Shot (ống kính nghiêng) - Dutch angle
- Cinematic Dolly Zoom (phóng to/thu nhỏ điện ảnh) - Vertigo effect`;

export const DEFAULT_PROMPT_TEMPLATE_CONFIG: PromptTemplateConfig = {
  storyboard: {
    shotGeneration: `Act as a professional cinematographer. Generate a detailed shot list (Camera blocking) for Scene {sceneIndex}.
Language for Text Output: {lang}.

IMPORTANT VISUAL STYLE: {stylePrompt}
All 'visualPrompt' fields MUST describe shots in this "{visualStyle}" style.
{artDirectionBlock}
Scene Details:
Location: {sceneLocation}
Time: {sceneTime}
Atmosphere: {sceneAtmosphere}

Scene Action:
"{sceneAction}"
Scene Action Source: {actionSource}

Context:
Genre: {genre}
Visual Style: {visualStyle} ({stylePrompt})
Target Duration (Whole Script): {targetDuration}
Active Video Model: {activeVideoModel}
Shot Duration Baseline: {shotDurationSeconds}s per shot
Total Shots Budget: {totalShotsNeeded} shots
Shots for This Scene: {shotsPerScene} shots (EXACT)

Characters:
{charactersJson}
Props:
{propsJson}

Professional Camera Movement Reference (Choose from these categories):
{cameraMovementReference}

Instructions:
1. Create EXACTLY {shotsPerScene} shots for this scene.
2. CRITICAL: Each shot should represent about {shotDurationSeconds} seconds. Total planning formula: {targetSeconds} seconds ÷ {shotDurationSeconds} ≈ {totalShotsNeeded} shots across all scenes.
3. DO NOT output more or fewer than {shotsPerScene} shots for this scene.
4. 'cameraMovement': Can reference the Professional Camera Movement Reference list above for inspiration, or use your own creative camera movements. You may use the exact English terms (e.g., "Dolly Shot", "Pan Right Shot", "Zoom In Shot", "Tracking Shot") or describe custom movements.
5. 'shotSize': Specify the field of view (e.g., Extreme Close-up, Medium Shot, Wide Shot).
6. 'actionSummary': Detailed description of what happens in the shot (in {lang}).
7. 'characters': Return ONLY IDs from provided Characters list.
8. 'props': Return ONLY IDs from provided Props list when a prop is visibly involved. Use [] if none.
9. 'visualPrompt': Detailed description for image generation in {visualStyle} style (OUTPUT IN {lang}). Include style-specific keywords.{artDirectionVisualPromptConstraint} Keep it under 50 words.

Output ONLY a valid JSON OBJECT with this exact structure (no markdown, no extra text):
{
  "shots": [
    {
      "id": "string",
      "sceneId": "{sceneId}",
      "actionSummary": "string",
      "dialogue": "string (empty if none)",
      "cameraMovement": "string",
      "shotSize": "string",
      "characters": ["string"],
      "props": ["string"],
      "keyframes": [
        {"id": "string", "type": "start|end", "visualPrompt": "string (MUST include {visualStyle} style keywords{keyframeVisualPromptConstraint})"}
      ]
    }
  ]
}`,
    shotRepair: `You previously returned {actualShots} shots for Scene {sceneIndex}, but EXACTLY {shotsPerScene} shots are required.

Scene Details:
Location: {sceneLocation}
Time: {sceneTime}
Atmosphere: {sceneAtmosphere}

Scene Action:
"{sceneAction}"

Requirements:
1. Return EXACTLY {shotsPerScene} shots in JSON object format: {"shots":[...]}.
2. Keep story continuity and preserve the original cinematic intent.
3. Each shot represents about {shotDurationSeconds} seconds.
4. Include fields: id, sceneId, actionSummary, dialogue, cameraMovement, shotSize, characters, props, keyframes.
5. characters/props must be arrays of valid IDs from provided context.
6. keyframes must include type=start/end and visualPrompt.
7. Output ONLY valid JSON object (no markdown).`,
  },
  keyframe: {
    startFrameGuide: `【Yêu cầu ảnh đầu】Thiết lập trạng thái ban đầu rõ ràng và bầu không khí cảnh quay, vị trí bắt đầu/tư thế/biểu cảm của nhân vật/vật thể phải rõ ràng, để lại không gian hình ảnh và động lực cho chuyển động tiếp theo.`,
    endFrameGuide: `【Yêu cầu ảnh cuối】Thể hiện trạng thái cuối cùng sau khi hành động hoàn thành, vị trí kết thúc/tư thế/thay đổi cảm xúc của nhân vật/vật thể, thể hiện sự thay đổi góc nhìn do chuyển động ống kính mang lại.`,
    characterConsistencyGuide: `【Yêu cầu nhất quán nhân vật】CHARACTER CONSISTENCY REQUIREMENTS - CRITICAL
⚠️ Nếu cung cấp hình ảnh tham khảo nhân vật, hình ảnh nhân vật phải tuân thủ chặt chẽ hình ảnh tham khảo:
• Đặc điểm khuôn mặt: Đường nét khuôn mặt, màu sắc và hình dạng mắt, cấu trúc mũi và miệng phải hoàn toàn giống nhau
• Kiểu tóc và màu tóc: Độ dài, màu sắc, chất cảm, kiểu tóc phải giữ nguyên
• Trang phục và phong cách: Kiểu dáng, màu sắc, chất liệu, phụ kiện phải khớp với hình ảnh tham khảo
• Đặc điểm thân hình: Tỷ lệ cơ thể, chiều cao phải giữ nguyên
⚠️ Đây là yêu cầu ưu tiên cao nhất, không thể thỏa hiệp!`,
    propWithImageGuide: `⚠️ Các đạo cụ sau đây đã cung cấp hình ảnh tham khảo, khi xuất hiện trong hình ảnh phải tuân thủ chặt chẽ hình ảnh tham khảo:
• Đặc điểm hình dạng: Hình dạng, kích thước, tỷ lệ của đạo cụ phải giống với hình ảnh tham khảo
• Màu sắc và chất liệu: Màu sắc, chất liệu, kết cấu phải giữ nguyên
• Yếu tố chi tiết: Hoa văn, chữ, chi tiết trang trí phải khớp với hình ảnh tham khảo
⚠️ Đây là yêu cầu ưu tiên cao!

Đạo cụ có hình ảnh tham khảo:
{propList}`,
    propWithoutImageGuide: `Các đạo cụ sau không có hình ảnh tham khảo, vui lòng thể hiện chính xác dựa trên mô tả văn bản:
{propList}`,
    nineGridSourceMeta: `【Nguồn】Xem trước lưới phân cảnh - {sourceLabel}
【Cỡ cảnh】{shotSize}
【Góc máy】{cameraAngle}
【Hành động gốc】{actionSummary}`,
  },
  nineGrid: {
    splitSystem: `Bạn là chuyên gia phân cảnh. Vui lòng chia cùng một cảnh quay thành {panelCount} góc nhìn khác nhau, dùng cho lưới phân cảnh {gridLayout}. Giữ tính liên tục của cảnh và nhân vật.`,
    splitUser: `Vui lòng chia nhỏ hành động cảnh quay sau đây thành {panelCount} góc quay khác nhau, dùng để tạo một hình ảnh lưới phân cảnh {gridLayout}.

【Hành động cảnh quay】{actionSummary}
【Chuyển động ống kính gốc】{cameraMovement}
【Thông tin cảnh】Địa điểm: {location}, Thời gian: {time}, Bầu không khí: {atmosphere}
【Nhân vật】{characters}
【Phong cách hình ảnh】{visualStyle}

Quy tắc đầu ra (chỉ xuất JSON):
1) Cấp cao nhất là {"panels":[...]}
2) panels phải chính xác {panelCount} mục, index=0-{lastIndex}, thứ tự từ trái sang phải, từ trên xuống dưới
3) Mỗi mục chứa shotSize, cameraAngle, description, không được để trống
4) shotSize/cameraAngle dùng tiếng Việt ngắn gọn; description dùng tiếng Anh một câu (10-30 từ), tập trung vào chủ thể, hành động, bố cục`,
    imagePrefix: `Create ONE cinematic storyboard image in a {gridLayout} grid ({panelCount} equal panels, thin white separators).
All panels depict the SAME scene; vary camera angle and shot size only.
Style: {visualStyle}
Panels (left-to-right, top-to-bottom):`,
    imagePanelTemplate: `Panel {index} ({position}): [{shotSize} / {cameraAngle}] - {description}`,
    imageSuffix: `Constraints:
- Output one single {gridLayout} grid image only
- Keep character identity consistent across all panels
- Keep lighting/color/mood consistent across all panels
- Each panel is a complete cinematic keyframe`,
  },
  video: {
    sora2Chinese: `Tạo video dựa trên hình ảnh tham khảo được cung cấp.
Mô tả hành động: {actionSummary}
Neo phong cách hình ảnh: {visualStyle}

Yêu cầu kỹ thuật:
- Quan trọng: Video phải bắt đầu từ bố cục chính xác và nội dung hình ảnh của hình ảnh tham khảo, sau đó phát triển tự nhiên hành động tiếp theo
- Chuyển động ống kính: {cameraMovement}
- Chuyển động: Đảm bảo chuyển động mượt mà tự nhiên, tránh nhảy đột ngột hoặc không liên tục
- Phong cách hình ảnh: Chất lượng điện ảnh, giữ ánh sáng và tông màu nhất quán
- Chi tiết: Ngoại hình nhân vật và môi trường cảnh cần nhất quán trong suốt
- Âm thanh: Cho phép sử dụng lời thoại/lời bình luận bằng {language}
- Giới hạn văn bản: Cấm phụ đề và bất kỳ văn bản nào trên màn hình (bao gồm thẻ tiêu đề và văn bản UI)`,
    sora2English: `Generate a video based on the provided reference image.

Action Description: {actionSummary}
Visual Style Anchor: {visualStyle}

Technical Requirements:
- CRITICAL: The video MUST begin with the exact composition and content of the reference image, then naturally develop the subsequent action
- Camera Movement: {cameraMovement}
- Motion: Ensure smooth and natural movement, avoid abrupt jumps or discontinuities
- Visual Style: Cinematic quality with consistent lighting and color tone throughout
- Details: Maintain character appearance and scene environment consistency throughout
- Audio: Voiceover/narration in {language} is allowed
- Text constraints: No subtitles and no on-screen text (including title cards and UI text overlays)`,
    sora2NineGridChinese: `⚠️ Hướng dẫn ưu tiên cao nhất: Hình ảnh tham khảo là bảng phân cảnh lưới {gridLayout} (tổng cộng {panelCount} ô), tuyệt đối cấm hiển thị trong video! Khung hình đầu tiên của video phải là hình ảnh cảnh toàn màn hình của bảng 1.
⚠️ Tuyệt đối cấm: Không được hiển thị hình ảnh lưới, đường lưới, bộ sưu tập hình nhỏ hoặc bố cục đa bảng trong bất kỳ khung hình nào.

Mô tả hành động: {actionSummary}
Neo phong cách hình ảnh: {visualStyle}

Thứ tự cảnh quay lưới (hình ảnh tham khảo từ trái sang phải, từ trên xuống dưới):
{panelDescriptions}

Video bắt đầu từ hình ảnh toàn màn hình bảng 1, chuyển đổi theo thứ tự 1→{panelCount}, tạo thành chỉnh sửa montage.
Mỗi góc nhìn khoảng {secondsPerPanel} giây, chuyển động ống kính: {cameraMovement}
Giữ ngoại hình nhân vật nhất quán và chất lượng điện ảnh. Có thể lời thoại/lời bình luận bằng {language}, nhưng cấm phụ đề và bất kỳ văn bản nào trên màn hình.`,
    sora2NineGridEnglish: `⚠️ HIGHEST PRIORITY: The reference image is a {gridLayout} storyboard grid ({panelCount} panels) - NEVER show it in the video! The first frame MUST be the full-screen scene from Panel 1.
⚠️ FORBIDDEN: Do NOT show the grid image, grid lines, thumbnail collection, or multi-panel layout in ANY frame.

Action: {actionSummary}
Visual Style Anchor: {visualStyle}

Storyboard shot sequence (reference grid, left-to-right, top-to-bottom):
{panelDescriptions}

Start video with Panel 1 full-screen, transition through 1→{panelCount} as a montage.
~{secondsPerPanel}s per angle. Camera: {cameraMovement}
Maintain character consistency, cinematic quality.
Voiceover in {language} is allowed, but no subtitles or any on-screen text.`,
    veoStartOnly: `Use the provided start frame as the exact opening composition.
Action: {actionSummary}
Camera Movement: {cameraMovement}
Visual Style Anchor: {visualStyle}
Language: {language}
Keep identity, scene lighting, and prop details consistent throughout the shot.`,
    veoStartEnd: `Use the provided START and END frames as hard constraints.
Action: {actionSummary}
Camera Movement: {cameraMovement}
Visual Style Anchor: {visualStyle}
Language: {language}
The video must start from the start frame composition and progress naturally to a final state that matches the end frame.`,
  },
};

export type PromptTemplateCategory = keyof PromptTemplateConfig;

export type PromptTemplatePath =
  | 'storyboard.shotGeneration'
  | 'storyboard.shotRepair'
  | 'keyframe.startFrameGuide'
  | 'keyframe.endFrameGuide'
  | 'keyframe.characterConsistencyGuide'
  | 'keyframe.propWithImageGuide'
  | 'keyframe.propWithoutImageGuide'
  | 'keyframe.nineGridSourceMeta'
  | 'nineGrid.splitSystem'
  | 'nineGrid.splitUser'
  | 'nineGrid.imagePrefix'
  | 'nineGrid.imagePanelTemplate'
  | 'nineGrid.imageSuffix'
  | 'video.sora2Chinese'
  | 'video.sora2English'
  | 'video.sora2NineGridChinese'
  | 'video.sora2NineGridEnglish'
  | 'video.veoStartOnly'
  | 'video.veoStartEnd';

export interface PromptTemplateFieldDefinition {
  path: PromptTemplatePath;
  category: PromptTemplateCategory;
  title: string;
  description: string;
  placeholders: string[];
}

export const PROMPT_TEMPLATE_FIELD_DEFINITIONS: PromptTemplateFieldDefinition[] = [
  {
    path: 'storyboard.shotGeneration',
    category: 'storyboard',
    title: 'Prompt Chính Sinh Phân Cảnh',
    description: 'Mẫu prompt chính tạo ra danh sách khung hình cho Bàn Đạo Diễn.',
    placeholders: [
      'sceneIndex',
      'lang',
      'visualStyle',
      'sceneLocation',
      'sceneAction',
      'shotsPerScene',
    ],
  },
  {
    path: 'storyboard.shotRepair',
    category: 'storyboard',
    title: 'Prompt Tự Động Sửa Lỗi',
    description: 'Mẫu prompt tự động kích hoạt khi AI tạo sai số lượng phân cảnh yêu cầu.',
    placeholders: ['actualShots', 'sceneIndex', 'shotsPerScene', 'sceneAction'],
  },
  {
    path: 'keyframe.startFrameGuide',
    category: 'keyframe',
    title: 'Luật Ảnh Đầu (Start Frame)',
    description: 'Các yêu cầu bắt buộc khi sinh hình ảnh bắt đầu của video.',
    placeholders: [],
  },
  {
    path: 'keyframe.endFrameGuide',
    category: 'keyframe',
    title: 'Luật Ảnh Cuối (End Frame)',
    description: 'Các yêu cầu bắt buộc khi sinh hình ảnh kết thúc của video.',
    placeholders: [],
  },
  {
    path: 'keyframe.characterConsistencyGuide',
    category: 'keyframe',
    title: 'Nhất Quán Nhân Vật',
    description: 'Khối quy tắc ép AI giữ đúng ngoại hình nhân vật ở cả ảnh đầu và cuối.',
    placeholders: [],
  },
  {
    path: 'keyframe.propWithImageGuide',
    category: 'keyframe',
    title: 'Nhất Quán Đạo Cụ (Có Ảnh)',
    description: 'Luật ràng buộc khi chỉ định sử dụng đạo cụ có kèm ảnh minh họa.',
    placeholders: ['propList'],
  },
  {
    path: 'keyframe.propWithoutImageGuide',
    category: 'keyframe',
    title: 'Miêu Tả Đạo Cụ (Không Ảnh)',
    description: 'Luật ràng buộc khi chỉ định sử dụng đạo cụ chỉ có tên miêu tả.',
    placeholders: ['propList'],
  },
  {
    path: 'keyframe.nineGridSourceMeta',
    category: 'keyframe',
    title: 'MetaData Ảnh Lưới',
    description: 'Siêu dữ liệu ghi kèm khi cắt ảnh Lưới đa điểm sang 1 khung hình đơn lẻ.',
    placeholders: ['sourceLabel', 'shotSize', 'cameraAngle', 'actionSummary'],
  },
  {
    path: 'nineGrid.splitSystem',
    category: 'nineGrid',
    title: 'Chỉ Thị Đóng Vai [Lưới Cảnh]',
    description: 'Câu lệnh hệ thống (System) hướng dẫn AI cách làm Lưới đa điểm.',
    placeholders: ['panelCount', 'gridLayout'],
  },
  {
    path: 'nineGrid.splitUser',
    category: 'nineGrid',
    title: 'Kiến Tạo Lưới Đa Điểm',
    description: 'Câu lệnh người dùng (User) yêu cầu AI tách khung hình thành Lưới đa điểm.',
    placeholders: [
      'panelCount',
      'gridLayout',
      'actionSummary',
      'cameraMovement',
      'characters',
      'visualStyle',
    ],
  },
  {
    path: 'nineGrid.imagePrefix',
    category: 'nineGrid',
    title: 'Prompt Dẫn Mở [Ảnh Lưới]',
    description: 'Đoạn đầu hướng dẫn công cụ vẽ AI tạo Lưới phân cảnh.',
    placeholders: ['gridLayout', 'panelCount', 'visualStyle'],
  },
  {
    path: 'nineGrid.imagePanelTemplate',
    category: 'nineGrid',
    title: 'Cấu Hình Một Ô [Ảnh Lưới]',
    description: 'Khung nội dung tiêu chuẩn áp dụng cho mỗi bộ phận của Ảnh lưới.',
    placeholders: ['index', 'position', 'shotSize', 'cameraAngle', 'description'],
  },
  {
    path: 'nineGrid.imageSuffix',
    category: 'nineGrid',
    title: 'Prompt Khóa Thể Loại [Ảnh Lưới]',
    description: 'Quy tắc chốt chặn đuôi để bắt AI ghép lại thành bố cục Ảnh lưới.',
    placeholders: ['gridLayout', 'panelCount'],
  },
  {
    path: 'video.sora2Chinese',
    category: 'video',
    title: 'Video AI (Sora - Tiếng Trung)',
    description: 'Mẫu render video Sora cho ngôn ngữ Tiếng Trung.',
    placeholders: ['actionSummary', 'cameraMovement', 'visualStyle', 'language'],
  },
  {
    path: 'video.sora2English',
    category: 'video',
    title: 'Video AI (Sora - Tiếng Anh)',
    description: 'Mẫu render video Sora cho ngôn ngữ Tiếng Anh.',
    placeholders: ['actionSummary', 'cameraMovement', 'visualStyle', 'language'],
  },
  {
    path: 'video.sora2NineGridChinese',
    category: 'video',
    title: 'Video Montage Lưới (Sora - Tiếng Trung)',
    description: 'Hiệu ứng video lướt góc máy Montage cho Tiếng Trung.',
    placeholders: [
      'actionSummary',
      'visualStyle',
      'gridLayout',
      'panelCount',
      'panelDescriptions',
      'secondsPerPanel',
      'cameraMovement',
      'language',
    ],
  },
  {
    path: 'video.sora2NineGridEnglish',
    category: 'video',
    title: 'Video Montage Lưới (Sora - Tiếng Anh)',
    description: 'Hiệu ứng video lướt góc máy Montage cho Tiếng Anh.',
    placeholders: [
      'actionSummary',
      'visualStyle',
      'gridLayout',
      'panelCount',
      'panelDescriptions',
      'secondsPerPanel',
      'cameraMovement',
      'language',
    ],
  },
  {
    path: 'video.veoStartOnly',
    category: 'video',
    title: 'Video AI (Veo - Chỉ Ảnh Đầu)',
    description: 'Mẫu báo Veo AI tập trung phát triển từ Ảnh khởi tạo.',
    placeholders: ['actionSummary', 'cameraMovement', 'visualStyle', 'language'],
  },
  {
    path: 'video.veoStartEnd',
    category: 'video',
    title: 'Video AI (Veo - Đầu và Cuối)',
    description: 'Mẫu báo Veo AI biến đổi nghiêm ngặt từ Đầu sang Cuối.',
    placeholders: ['actionSummary', 'cameraMovement', 'visualStyle', 'language'],
  },
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const sanitizeSection = <T extends object>(
  input: unknown,
  defaults: T
): Partial<T> | undefined => {
  if (!isObject(input)) return undefined;
  const sanitized: Partial<T> = {};
  (Object.keys(defaults) as Array<keyof T>).forEach((key) => {
    const value = (input as Record<string, unknown>)[String(key)];
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[String(key)] = value;
    }
  });
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

export const sanitizePromptTemplateOverrides = (
  overrides?: PromptTemplateOverrides | null
): PromptTemplateOverrides | undefined => {
  if (!isObject(overrides)) return undefined;

  const storyboard = sanitizeSection(overrides.storyboard, DEFAULT_PROMPT_TEMPLATE_CONFIG.storyboard);
  const keyframe = sanitizeSection(overrides.keyframe, DEFAULT_PROMPT_TEMPLATE_CONFIG.keyframe);
  const nineGrid = sanitizeSection(overrides.nineGrid, DEFAULT_PROMPT_TEMPLATE_CONFIG.nineGrid);
  const video = sanitizeSection(overrides.video, DEFAULT_PROMPT_TEMPLATE_CONFIG.video);

  const normalized: PromptTemplateOverrides = {};
  if (storyboard) normalized.storyboard = storyboard;
  if (keyframe) normalized.keyframe = keyframe;
  if (nineGrid) normalized.nineGrid = nineGrid;
  if (video) normalized.video = video;

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

export const resolvePromptTemplateConfig = (
  overrides?: PromptTemplateOverrides | null
): PromptTemplateConfig => {
  const normalizedOverrides = sanitizePromptTemplateOverrides(overrides);
  return {
    storyboard: {
      ...DEFAULT_PROMPT_TEMPLATE_CONFIG.storyboard,
      ...(normalizedOverrides?.storyboard || {}),
    },
    keyframe: {
      ...DEFAULT_PROMPT_TEMPLATE_CONFIG.keyframe,
      ...(normalizedOverrides?.keyframe || {}),
    },
    nineGrid: {
      ...DEFAULT_PROMPT_TEMPLATE_CONFIG.nineGrid,
      ...(normalizedOverrides?.nineGrid || {}),
    },
    video: {
      ...DEFAULT_PROMPT_TEMPLATE_CONFIG.video,
      ...(normalizedOverrides?.video || {}),
    },
  };
};

const splitPromptTemplatePath = (
  path: PromptTemplatePath
): [PromptTemplateCategory, string] => {
  const [category, key] = path.split('.') as [PromptTemplateCategory, string];
  return [category, key];
};

export const getPromptTemplateValueByPath = (
  config: PromptTemplateConfig,
  path: PromptTemplatePath
): string => {
  const [category, key] = splitPromptTemplatePath(path);
  const section = config[category] as unknown as Record<string, string>;
  return section[key] || '';
};

export const getDefaultPromptTemplateValue = (path: PromptTemplatePath): string => {
  return getPromptTemplateValueByPath(DEFAULT_PROMPT_TEMPLATE_CONFIG, path);
};

export const hasPromptTemplateOverride = (
  overrides: PromptTemplateOverrides | undefined,
  path: PromptTemplatePath
): boolean => {
  const normalized = sanitizePromptTemplateOverrides(overrides);
  if (!normalized) return false;
  const [category, key] = splitPromptTemplatePath(path);
  return typeof (normalized[category] as Record<string, string> | undefined)?.[key] === 'string';
};

export const setPromptTemplateOverride = (
  overrides: PromptTemplateOverrides | undefined,
  path: PromptTemplatePath,
  value: string
): PromptTemplateOverrides => {
  const normalized = sanitizePromptTemplateOverrides(overrides) || {};
  const [category, key] = splitPromptTemplatePath(path);
  const nextSection = {
    ...((normalized[category] as Record<string, string>) || {}),
    [key]: value,
  };
  const next: PromptTemplateOverrides = {
    ...normalized,
    [category]: nextSection,
  };
  return sanitizePromptTemplateOverrides(next) || {};
};

export const removePromptTemplateOverride = (
  overrides: PromptTemplateOverrides | undefined,
  path: PromptTemplatePath
): PromptTemplateOverrides | undefined => {
  const normalized = sanitizePromptTemplateOverrides(overrides);
  if (!normalized) return undefined;

  const [category, key] = splitPromptTemplatePath(path);
  const currentSection = { ...((normalized[category] as Record<string, string>) || {}) };
  delete currentSection[key];

  const next: PromptTemplateOverrides = {
    ...normalized,
  };

  if (Object.keys(currentSection).length === 0) {
    delete next[category];
  } else {
    next[category] = currentSection as any;
  }

  return sanitizePromptTemplateOverrides(next);
};

export const searchPromptTemplateFields = (
  config: PromptTemplateConfig,
  query: string
): PromptTemplateFieldDefinition[] => {
  const keyword = String(query || '').trim().toLowerCase();
  if (!keyword) return PROMPT_TEMPLATE_FIELD_DEFINITIONS;

  return PROMPT_TEMPLATE_FIELD_DEFINITIONS.filter((field) => {
    const currentValue = getPromptTemplateValueByPath(config, field.path).toLowerCase();
    return (
      field.title.toLowerCase().includes(keyword) ||
      field.description.toLowerCase().includes(keyword) ||
      field.path.toLowerCase().includes(keyword) ||
      field.category.toLowerCase().includes(keyword) ||
      currentValue.includes(keyword)
    );
  });
};

export const getPromptTemplateCategoryLabel = (category: PromptTemplateCategory): string => {
  switch (category) {
    case 'storyboard':
      return 'Bàn Đạo Diễn (Storyboard)';
    case 'keyframe':
      return 'Khung Hình Đầu/Cuối';
    case 'nineGrid':
      return 'Lưới Đa Góc (Grid)';
    case 'video':
      return 'Kiến Tạo Video';
    default:
      return category;
  }
};

export const renderPromptTemplate = (
  template: string,
  variables: Record<string, string | number | undefined | null>
): string => {
  return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    const value = variables[key];
    if (value === undefined || value === null) {
      return `{${key}}`;
    }
    return String(value);
  });
};

export const withTemplateFallback = (
  candidate: string | undefined | null,
  fallback: string
): string => {
  const value = String(candidate ?? '');
  return value.trim().length > 0 ? value : fallback;
};

export const getStoryboardCameraMovementReference = (): string => CAMERA_MOVEMENT_REFERENCE;
