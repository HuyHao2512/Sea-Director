/**
 * Prompt Constants
 * Centrally manage all visual style-related prompt mappings to eliminate duplicate definitions in various functions
 */

// ============================================
// English Visual Style Prompts (for AI image generation prompts)
// ============================================

export const VISUAL_STYLE_PROMPTS: { [key: string]: string } = {
  'live-action': 'photorealistic, cinematic film quality, real human actors, professional cinematography, natural lighting, 8K resolution, shallow depth of field, film grain texture, color graded, anamorphic lens flare, three-point lighting setup',
  'anime': 'Japanese anime style, cel-shaded, vibrant saturated colors, large expressive eyes with detailed iris highlights, dynamic action poses, clean sharp outlines, consistent line weight throughout, Studio Ghibli/Makoto Shinkai quality, painted sky backgrounds, soft ambient lighting with dramatic rim light',
  '2d-animation': 'classic 2D animation, hand-drawn style, Disney/Pixar quality, smooth clean lines with consistent weight, expressive characters with squash-and-stretch principles, painterly watercolor backgrounds, soft gradient shading, warm color palette, round friendly character proportions',
  '3d-animation': 'high-quality 3D CGI animation, Pixar/DreamWorks style, subsurface scattering on skin, detailed PBR textures, stylized character proportions, volumetric lighting, ambient occlusion, soft shadows, physically-based rendering, motion blur',
  'cyberpunk': 'cyberpunk aesthetic, neon-lit urban environment, rain-soaked reflective streets, holographic UI displays, high-tech low-life contrast, Blade Runner style, volumetric fog with neon color bleeding, chromatic aberration, cool blue-purple palette with hot pink and cyan accents, gritty detailed textures',
  'oil-painting': 'oil painting style, visible impasto brushstrokes, rich layered textures, classical art composition with golden ratio, museum quality fine art, warm undertones, Rembrandt lighting, chiaroscuro contrast, canvas texture visible, glazing technique color depth',
};

// ============================================
// Vietnamese Visual Style Descriptions (for Vietnamese prompts and UI display)
// ============================================

export const VISUAL_STYLE_PROMPTS_VI: { [key: string]: string } = {
  'live-action': 'Phong cách phim thực tế, photorealistic, 8K HD, nhiếp ảnh chuyên nghiệp',
  'anime': 'Phong cách anime Nhật Bản, cel-shaded, màu sắc rực rỡ, chất lượng Studio Ghibli',
  '2d-animation': 'Phong cách hoạt hình 2D cổ điển, vẽ tay, chất lượng Disney/Pixar',
  '3d-animation': 'Hoạt hình CGI 3D, phong cách Pixar/DreamWorks, vật liệu chi tiết',
  'cyberpunk': 'Thẩm mỹ cyberpunk, ánh sáng neon, cảm giác công nghệ tương lai',
  'oil-painting': 'Phong cách sơn dầu, nét vẽ có thể nhìn thấy, bố cục nghệ thuật cổ điển',
};

// ============================================
// Character Negative Prompts (exclude unwanted visual elements)
// ============================================

export const NEGATIVE_PROMPTS: { [key: string]: string } = {
  'live-action': 'cartoon, anime, illustration, painting, drawing, 3d render, cgi, low quality, blurry, grainy, watermark, text, logo, signature, distorted face, bad anatomy, extra limbs, mutated hands, deformed, ugly, disfigured, poorly drawn, amateur',
  'anime': 'photorealistic, 3d render, western cartoon, ugly, bad anatomy, extra limbs, deformed limbs, blurry, watermark, text, logo, poorly drawn face, mutated hands, extra fingers, missing fingers, bad proportions, grotesque',
  '2d-animation': 'photorealistic, 3d, low quality, pixelated, blurry, watermark, text, bad anatomy, deformed, ugly, amateur drawing, inconsistent style, rough sketch',
  '3d-animation': 'photorealistic, 2d, flat, hand-drawn, low poly, bad topology, texture artifacts, z-fighting, clipping, low quality, blurry, watermark, text, bad rigging, unnatural movement',
  'cyberpunk': 'bright daylight, pastoral, medieval, fantasy, cartoon, low tech, rural, natural, watermark, text, logo, low quality, blurry, amateur',
  'oil-painting': 'digital art, photorealistic, 3d render, cartoon, anime, low quality, blurry, watermark, text, amateur, poorly painted, muddy colors, overworked canvas',
};

// ============================================
// Scene-Specific Negative Prompts (additionally exclude human/humanoid elements)
// ============================================

export const SCENE_NEGATIVE_PROMPTS: { [key: string]: string } = {
  'live-action': 'person, people, human, man, woman, child, figure, silhouette, crowd, pedestrian, portrait, face, body, hands, feet, ' + NEGATIVE_PROMPTS['live-action'],
  'anime': 'person, people, human, character, figure, silhouette, crowd, portrait, face, body, hands, ' + NEGATIVE_PROMPTS['anime'],
  '2d-animation': 'person, people, human, character, figure, silhouette, crowd, portrait, face, body, ' + NEGATIVE_PROMPTS['2d-animation'],
  '3d-animation': 'person, people, human, character, figure, silhouette, crowd, portrait, face, body, ' + NEGATIVE_PROMPTS['3d-animation'],
  'cyberpunk': 'person, people, human, figure, silhouette, crowd, pedestrian, portrait, face, body, ' + NEGATIVE_PROMPTS['cyberpunk'],
  'oil-painting': 'person, people, human, figure, silhouette, crowd, portrait, face, body, ' + NEGATIVE_PROMPTS['oil-painting'],
};

/**
 * Get English prompt for visual style, return as-is if style not in presets
 */
export const getStylePrompt = (visualStyle: string): string => {
  return VISUAL_STYLE_PROMPTS[visualStyle] || visualStyle;
};

/**
 * Get Vietnamese description for visual style, return as-is if style not in presets
 */
export const getStylePromptVI = (visualStyle: string): string => {
  return VISUAL_STYLE_PROMPTS_VI[visualStyle] || visualStyle;
};

/**
 * Get character negative prompts
 */
export const getNegativePrompt = (visualStyle: string): string => {
  return NEGATIVE_PROMPTS[visualStyle] || NEGATIVE_PROMPTS['live-action'];
};

/**
 * Get scene negative prompts
 */
export const getSceneNegativePrompt = (visualStyle: string): string => {
  return SCENE_NEGATIVE_PROMPTS[visualStyle] || SCENE_NEGATIVE_PROMPTS['live-action'];
};
