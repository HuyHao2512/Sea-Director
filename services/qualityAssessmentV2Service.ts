import { ScriptData, Shot, ShotQualityAssessment, QualityCheck } from '../types';
import {
  chatCompletion,
  cleanJsonString,
  retryOperation,
  getActiveChatModel,
} from './aiService';
import { assessShotQuality } from './qualityAssessmentService';

const QUALITY_SCHEMA_VERSION = 2;

const CHECK_DEFINITIONS = [
  { key: 'prompt-readiness', label: 'Prompt Readiness', weight: 30 },
  { key: 'asset-coverage', label: 'Asset Coverage', weight: 20 },
  { key: 'keyframe-execution', label: 'Keyframe Execution', weight: 30 },
  { key: 'video-execution', label: 'Video Execution', weight: 20 },
  { key: 'continuity-risk', label: 'Continuity Risk', weight: 10 },
] as const;

type CheckKey = typeof CHECK_DEFINITIONS[number]['key'];

interface LLMQualityAssessmentOptions {
  model?: string;
  timeoutMs?: number;
  temperature?: number;
  maxTokens?: number;
  retries?: number;
}

interface LLMRawCheck {
  key?: string;
  score?: number;
  passed?: boolean;
  details?: string;
}

interface LLMRawResponse {
  score?: number;
  grade?: string;
  summary?: string;
  checks?: LLMRawCheck[];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const truncateText = (value: string | undefined, maxLen: number) => {
  const text = (value || '').trim();
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}...`;
};

const toSafeScore = (value: unknown, fallback = 50): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return clamp(Math.round(num), 0, 100);
};

const isGrade = (value: unknown): value is ShotQualityAssessment['grade'] =>
  value === 'pass' || value === 'warning' || value === 'fail';

const resolveGrade = (score: number): ShotQualityAssessment['grade'] => {
  if (score >= 80) return 'pass';
  if (score >= 60) return 'warning';
  return 'fail';
};

const weightedScore = (checks: QualityCheck[]): number => {
  const weightedSum = checks.reduce((sum, check) => sum + check.score * check.weight, 0);
  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0) || 1;
  return Math.round(weightedSum / totalWeight);
};

const buildSummary = (checks: QualityCheck[], grade: ShotQualityAssessment['grade']): string => {
  const failedLabels = checks.filter((check) => !check.passed).map((check) => check.label);
  if (!failedLabels.length) {
    return 'Đánh giá AI đã vượt qua, có thể đi vào sản xuất trực tiếp.';
  }
  if (grade === 'fail') return `Đánh giá AI cho thấy rủi ro cao: ${failedLabels.join(', ')}`;
  if (grade === 'warning') return `Đánh giá AI đề xuất tối ưu hóa: ${failedLabels.join(', ')}`;
  return `Đánh giá AI cho thấy vấn đề nhẹ: ${failedLabels.join(', ')}`;
};

const safeJsonParse = (raw: string): LLMRawResponse => {
  const cleaned = cleanJsonString(raw);
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw error;
  }
};

const buildShotAssessmentContext = (shot: Shot, scriptData?: ScriptData | null) => {
  const scene = scriptData?.scenes.find((entry) => String(entry.id) === String(shot.sceneId));
  const startFrame = shot.keyframes?.find((frame) => frame.type === 'start');
  const endFrame = shot.keyframes?.find((frame) => frame.type === 'end');
  const characters = (shot.characters || []).map((charId) => {
    const char = scriptData?.characters.find((entry) => String(entry.id) === String(charId));
    const variationId = shot.characterVariations?.[charId];
    const variation = variationId ? char?.variations?.find((entry) => entry.id === variationId) : undefined;
    return {
      id: charId,
      name: char?.name || `unknown:${charId}`,
      hasReferenceImage: !!char?.referenceImage,
      selectedVariationName: variation?.name,
      selectedVariationHasReference: !!variation?.referenceImage,
    };
  });

  const props = (shot.props || []).map((propId) => {
    const prop = scriptData?.props?.find((entry) => String(entry.id) === String(propId));
    return {
      id: propId,
      name: prop?.name || `unknown:${propId}`,
      hasReferenceImage: !!prop?.referenceImage,
    };
  });

  return {
    shot: {
      id: shot.id,
      sceneId: shot.sceneId,
      cameraMovement: shot.cameraMovement || '',
      shotSize: shot.shotSize || '',
      actionSummary: truncateText(shot.actionSummary, 280),
      dialogue: truncateText(shot.dialogue, 200),
      videoModel: shot.videoModel || '',
    },
    scene: scene
      ? {
          id: scene.id,
          location: scene.location,
          time: scene.time,
          atmosphere: truncateText(scene.atmosphere, 200),
          hasReferenceImage: !!scene.referenceImage,
        }
      : null,
    characters,
    props,
    keyframes: {
      start: {
        status: startFrame?.status || 'pending',
        hasImage: !!startFrame?.imageUrl,
        promptLength: (startFrame?.visualPrompt || '').trim().length,
        promptExcerpt: truncateText(startFrame?.visualPrompt, 220),
      },
      end: {
        status: endFrame?.status || 'pending',
        hasImage: !!endFrame?.imageUrl,
        promptLength: (endFrame?.visualPrompt || '').trim().length,
        promptExcerpt: truncateText(endFrame?.visualPrompt, 220),
      },
    },
    interval: shot.interval
      ? {
          status: shot.interval.status,
          hasVideo: !!shot.interval.videoUrl,
          duration: shot.interval.duration,
          motionStrength: shot.interval.motionStrength,
          promptLength: (shot.interval.videoPrompt || '').trim().length,
          promptExcerpt: truncateText(shot.interval.videoPrompt, 220),
        }
      : null,
  };
};

const buildPrompt = (shot: Shot, scriptData?: ScriptData | null): string => {
  const context = buildShotAssessmentContext(shot, scriptData);
  const checks = CHECK_DEFINITIONS.map((item) => item.key).join(', ');

  return [
    'Bạn là một đạo diễn kiểm chất lượng phân cảnh chuyên nghiệp cho AI.',
    'Vui lòng đánh giá dựa trên bối cảnh đầu vào xem cảnh quay hiện tại có "có thể tạo ra sản phẩm ổn định" hay không.',
    'Điểm số càng cao thì càng ổn định, có thể thực hiện được.',
    '',
    'Bạn phải xuất ra đối tượng JSON và tuân thủ chặt chẽ định dạng sau:',
    '{',
    '  "score": số nguyên từ 0-100,',
    '  "grade": "pass" | "warning" | "fail",',
    '  "summary": "tóm tắt một câu bằng tiếng Việt",',
    '  "checks": [',
    '    {"key":"prompt-readiness","score":0-100,"passed":true/false,"details":"giải thích bằng tiếng Việt"},',
    '    {"key":"asset-coverage","score":0-100,"passed":true/false,"details":"giải thích bằng tiếng Việt"},',
    '    {"key":"keyframe-execution","score":0-100,"passed":true/false,"details":"giải thích bằng tiếng Việt"},',
    '    {"key":"video-execution","score":0-100,"passed":true/false,"details":"giải thích bằng tiếng Việt"},',
    '    {"key":"continuity-risk","score":0-100,"passed":true/false,"details":"giải thích bằng tiếng Việt"}',
    '  ]',
    '}',
    '',
    `Yêu cầu: checks phải và chỉ có thể chứa 5 key này, thứ tự không giới hạn: ${checks}`,
    'Yêu cầu: details phải giải thích "cơ sở đánh giá + điểm rủi ro + hành động được đề xuất", xuất bằng tiếng Việt, 2-4 câu.',
    'Yêu cầu: khi thông tin không đủ, hãy viết rõ "thông tin không đủ" và cho điểm bảo thủ.',
    'Cấm xuất markdown, khối mã, giải thích trường bổ sung.',
    '',
    'Bối cảnh đầu vào (JSON):',
    JSON.stringify(context, null, 2),
  ].join('\n');
};

const normalizeChecks = (rawChecks: LLMRawCheck[] | undefined): QualityCheck[] => {
  const rawMap = new Map<string, LLMRawCheck>();
  (rawChecks || []).forEach((check) => {
    if (typeof check.key === 'string' && check.key.trim()) {
      rawMap.set(check.key.trim(), check);
    }
  });

  return CHECK_DEFINITIONS.map((definition) => {
    const raw = rawMap.get(definition.key);
    const score = toSafeScore(raw?.score, 50);
    const passed = typeof raw?.passed === 'boolean' ? raw.passed : score >= 70;
    const details = truncateText(raw?.details, 420) || 'Thông tin không đủ, mô hình không trả về cơ sở chi tiết.';
    return {
      key: definition.key,
      label: definition.label,
      weight: definition.weight,
      score,
      passed,
      details,
    };
  });
};

const fallbackAssessment = (
  shot: Shot,
  scriptData?: ScriptData | null,
  reason?: string
): ShotQualityAssessment => {
  const base = assessShotQuality(shot, scriptData);
  const reasonMessage = truncateText(reason, 120);
  return {
    ...base,
    summary: reasonMessage
      ? `Đánh giá AI không khả dụng, đã quay lại điểm số dựa trên quy tắc: ${reasonMessage}`
      : 'Đánh giá AI không khả dụng, đã quay lại điểm số dựa trên quy tắc.',
  };
};

const resolveAssessment = (parsed: LLMRawResponse): ShotQualityAssessment => {
  const checks = normalizeChecks(parsed.checks);
  const weighted = weightedScore(checks);
  const score = toSafeScore(parsed.score, weighted);
  const grade = isGrade(parsed.grade) ? parsed.grade : resolveGrade(score);
  const summary = truncateText(parsed.summary, 260) || buildSummary(checks, grade);

  return {
    version: QUALITY_SCHEMA_VERSION,
    score,
    grade,
    generatedAt: Date.now(),
    checks,
    summary,
  };
};

export const assessShotQualityWithLLM = async (
  shot: Shot,
  scriptData?: ScriptData | null,
  options?: LLMQualityAssessmentOptions
): Promise<ShotQualityAssessment> => {
  const activeChatModel = getActiveChatModel() as any;
  const model =
    options?.model ||
    activeChatModel?.id ||
    activeChatModel?.apiModel ||
    'gpt-5.2';

  try {
    const prompt = buildPrompt(shot, scriptData);
    const responseText = await retryOperation(
      () =>
        chatCompletion(
          prompt,
          model,
          options?.temperature ?? 0.2,
          options?.maxTokens ?? 4096,
          'json_object',
          options?.timeoutMs ?? 120000
        ),
      options?.retries ?? 2,
      1500
    );

    const parsed = safeJsonParse(responseText);
    return resolveAssessment(parsed);
  } catch (error: any) {
    console.warn('[quality-v2] LLM scoring failed, fallback to V1.', error);
    return fallbackAssessment(shot, scriptData, error?.message);
  }
};
