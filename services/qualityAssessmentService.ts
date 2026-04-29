import { ScriptData, Shot, ShotQualityAssessment, QualityCheck } from '../types';

const QUALITY_SCHEMA_VERSION = 1;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const resolveSupportsEndFrame = (modelId?: string): boolean => {
  const id = (modelId || '').toLowerCase();
  if (!id) return false;
  if (id.startsWith('sora') || id.startsWith('doubao-seedance')) return false;
  return true;
};

const pickCheck = (
  key: string,
  label: string,
  score: number,
  weight: number,
  details?: string
): QualityCheck => ({
  key,
  label,
  score: clamp(Math.round(score), 0, 100),
  weight,
  passed: score >= 70,
  details,
});

const evaluatePromptReadiness = (shot: Shot): QualityCheck => {
  const startPrompt = shot.keyframes?.find((frame) => frame.type === 'start')?.visualPrompt?.trim() || '';
  const endPrompt = shot.keyframes?.find((frame) => frame.type === 'end')?.visualPrompt?.trim() || '';
  const videoPrompt = shot.interval?.videoPrompt?.trim() || '';
  const actionSummaryLen = shot.actionSummary.trim().length;

  let startScore = 0;
  if (startPrompt.length >= 40) startScore = 45;
  else if (startPrompt.length >= 16) startScore = 30;
  else if (startPrompt.length > 0) startScore = 15;

  let endScore = 0;
  if (endPrompt.length >= 30) endScore = 25;
  else if (endPrompt.length > 0) endScore = 10;

  let videoScore = 0;
  if (videoPrompt.length >= 30) videoScore = 20;
  else if (videoPrompt.length > 0) videoScore = 10;

  const actionScore = actionSummaryLen >= 12 ? 10 : 0;
  const score = startScore + endScore + videoScore + actionScore;

  const details = [
    'Quy tắc: ảnh đầu 45 điểm + ảnh cuối 25 điểm + prompt video 20 điểm + tóm tắt hành động 10 điểm',
    `Độ dài ảnh đầu ${startPrompt.length} ký tự -> ${startScore} điểm (>=40 được 45; 16-39 được 30; 1-15 được 15)`,
    `Độ dài ảnh cuối ${endPrompt.length} ký tự -> ${endScore} điểm (>=30 được 25; 1-29 được 10)`,
    `Độ dài prompt video ${videoPrompt.length} ký tự -> ${videoScore} điểm (>=30 được 20; 1-29 được 10)`,
    `Độ dài tóm tắt hành động ${actionSummaryLen} ký tự -> ${actionScore} điểm (>=12 được 10)`,
  ].join('\n');

  return pickCheck(
    'prompt-readiness',
    'Prompt Readiness',
    score,
    30,
    details
  );
};

const evaluateAssetCoverage = (shot: Shot, scriptData?: ScriptData | null): QualityCheck => {
  if (!scriptData) {
    return pickCheck(
      'asset-coverage',
      'Asset Coverage',
      35,
      20,
      'Không phát hiện dữ liệu tài sản kịch bản, không thể xác minh ảnh tham khảo bối cảnh/nhân vật/đạo cụ, tính theo điểm bảo thủ 35.'
    );
  }

  const scene = scriptData.scenes.find((entry) => String(entry.id) === String(shot.sceneId));
  const sceneScore = scene?.referenceImage ? 35 : 10;

  const charIds = shot.characters || [];
  const charDetails: string[] = [];
  const charScoreParts = charIds.map((charId) => {
    const char = scriptData.characters.find((entry) => String(entry.id) === String(charId));
    if (!char) {
      charDetails.push(`Nhân vật ${charId}: không tìm thấy dữ liệu nhân vật (0 điểm)`);
      return 0;
    }
    const variationId = shot.characterVariations?.[charId];
    if (variationId) {
      const variation = char.variations?.find((entry) => entry.id === variationId);
      if (variation?.referenceImage) {
        charDetails.push(`${char.name}(${variation.name}): có ảnh tham khảo biến thể (25 điểm)`);
        return 25;
      }
    }
    if (char.referenceImage) {
      charDetails.push(`${char.name}: có ảnh tham khảo nhân vật (25 điểm)`);
      return 25;
    }
    charDetails.push(`${char.name}: thiếu ảnh tham khảo nhân vật (5 điểm)`);
    return 5;
  });
  const characterScore = charScoreParts.length
    ? charScoreParts.reduce((sum, value) => sum + value, 0) / charScoreParts.length
    : 20;

  const props = shot.props || [];
  const propDetails: string[] = [];
  const propScoreParts = props.map((propId) => {
    const prop = scriptData.props?.find((entry) => String(entry.id) === String(propId));
    if (!prop) {
      propDetails.push(`Đạo cụ ${propId}: không tìm thấy dữ liệu đạo cụ (0 điểm)`);
      return 0;
    }
    if (prop.referenceImage) {
      propDetails.push(`${prop.name}: có ảnh tham khảo (10 điểm)`);
      return 10;
    }
    propDetails.push(`${prop.name}: thiếu ảnh tham khảo (4 điểm)`);
    return 4;
  });
  const propScore = propScoreParts.length
    ? propScoreParts.reduce((sum, value) => sum + value, 0) / propScoreParts.length
    : 10;

  const totalScore = sceneScore + characterScore + propScore;
  const details = [
    'Quy tắc: ảnh tham khảo bối cảnh tối đa 35 điểm + ảnh tham khảo nhân vật trung bình tối đa 25 điểm + ảnh tham khảo đạo cụ trung bình tối đa 10 điểm',
    `Bối cảnh "​${scene?.location || shot.sceneId}": ${scene?.referenceImage ? 'có ảnh tham khảo (35 điểm)' : 'không có ảnh tham khảo (10 điểm)'}`,
    charIds.length
      ? `Nhân vật (${charIds.length}): ${charDetails.join('; ')} -> trung bình ${Math.round(characterScore)} điểm`
      : 'Nhân vật: cảnh quay này không có nhân vật, tính theo mặc định 20 điểm',
    props.length
      ? `Đạo cụ (${props.length}): ${propDetails.join('; ')} -> trung bình ${Math.round(propScore)} điểm`
      : 'Đạo cụ: cảnh quay này không có đạo cụ, tính theo mặc định 10 điểm',
    `Tổng điểm: ${Math.round(totalScore)}/100`,
  ].join('\n');

  return pickCheck(
    'asset-coverage',
    'Asset Coverage',
    totalScore,
    20,
    details
  );
};

const evaluateKeyframeExecution = (shot: Shot): QualityCheck => {
  const startFrame = shot.keyframes?.find((frame) => frame.type === 'start');
  const endFrame = shot.keyframes?.find((frame) => frame.type === 'end');
  const supportsEndFrame = resolveSupportsEndFrame(shot.videoModel);

  const describeFrame = (label: string, frame?: Shot['keyframes'][number]) => {
    const status = frame?.status || 'pending';
    const hasImage = !!frame?.imageUrl;
    const hasPrompt = !!frame?.visualPrompt;
    return `${label}: trạng thái ${status}, ${hasImage ? 'đã tạo ảnh' : 'chưa tạo ảnh'}, ${hasPrompt ? 'có prompt' : 'không có prompt'}`;
  };

  let startScore = 0;
  if (startFrame?.imageUrl) startScore = 55;
  else if (startFrame?.status === 'generating') startScore = 25;
  else if (startFrame?.visualPrompt) startScore = 15;

  let endScore = 0;
  if (supportsEndFrame) {
    if (endFrame?.imageUrl) endScore = 35;
    else if (endFrame?.status === 'generating') endScore = 15;
    else if (endFrame?.visualPrompt) endScore = 10;
  } else {
    endScore = 30;
  }

  let penalty = 0;
  if (startFrame?.status === 'failed' || endFrame?.status === 'failed') {
    penalty = -20;
  }

  const score = startScore + endScore + penalty;
  const details = [
    'Quy tắc: ảnh đầu tối đa 55 điểm + ảnh cuối tối đa 35 điểm (nếu mô hình không hỗ trợ ảnh cuối thì cố định 30 điểm) + phạt lỗi 20 điểm',
    describeFrame('Ảnh đầu', startFrame),
    supportsEndFrame
      ? describeFrame('Ảnh cuối', endFrame)
      : `Ảnh cuối: mô hình hiện tại ${shot.videoModel || 'chưa được đặt'} không hỗ trợ nội suy ảnh cuối, xử lý theo cố định 30 điểm`,
    penalty < 0 ? 'Phát hiện trạng thái lỗi keyframe: phạt thêm 20 điểm' : 'Không phát hiện trạng thái lỗi keyframe: không phạt',
    `Tổng điểm: ${Math.round(score)}/100`,
  ].join('\n');

  return pickCheck(
    'keyframe-execution',
    'Keyframe Execution',
    score,
    30,
    details
  );
};

const evaluateVideoExecution = (shot: Shot): QualityCheck => {
  const interval = shot.interval;
  if (!interval) {
    return pickCheck(
      'video-execution',
      'Video Execution',
      30,
      20,
      'Không phát hiện bản ghi tạo video: cảnh quay hiện tại chưa bắt đầu tạo video, do đó tính theo điểm cơ bản 30.'
    );
  }

  let score = 0;
  let reason = '';
  if (interval.videoUrl && interval.status === 'completed') score = 100;
  else if (interval.status === 'generating') score = 55;
  else if (interval.status === 'pending') score = 35;
  else if (interval.status === 'failed') score = 10;

  if (interval.videoUrl && interval.status === 'completed') {
    reason = 'Video đã được tạo thành công và URL đã được điền lại (100 điểm).';
  } else if (interval.status === 'generating') {
    reason = 'Video vẫn đang được tạo (55 điểm).';
  } else if (interval.status === 'pending') {
    reason = 'Tác vụ video ở trạng thái chờ tạo (35 điểm).';
  } else if (interval.status === 'failed') {
    reason = 'Tạo video thất bại (10 điểm).';
  } else {
    reason = `Trạng thái video là ${interval.status}, tính theo điểm bảo thủ ${score}.`;
  }

  const details = [
    'Quy tắc: completed=100, generating=55, pending=35, failed=10',
    `Trạng thái hiện tại: ${interval.status}, ${interval.videoUrl ? 'đã có URL video' : 'không có URL video'}`,
    reason,
  ].join('\n');

  return pickCheck(
    'video-execution',
    'Video Execution',
    score,
    20,
    details
  );
};

const evaluateContinuity = (shot: Shot): QualityCheck => {
  const startFrame = shot.keyframes?.find((frame) => frame.type === 'start');
  const endFrame = shot.keyframes?.find((frame) => frame.type === 'end');
  const supportsEndFrame = resolveSupportsEndFrame(shot.videoModel);
  const hasCharacters = (shot.characters?.length || 0) > 0;

  let baseScore = 40;
  let startBonus = 0;
  let endBonus = 0;
  let modelCompensation = 0;
  let charPenalty = 0;
  let charEndPenalty = 0;

  if (startFrame?.imageUrl) startBonus = 25;
  if (supportsEndFrame && endFrame?.imageUrl) endBonus = 25;
  if (!supportsEndFrame) modelCompensation = 20;

  if (hasCharacters && !startFrame?.imageUrl) charPenalty = -20;
  if (supportsEndFrame && hasCharacters && !endFrame?.imageUrl) charEndPenalty = -10;

  const score = baseScore + startBonus + endBonus + modelCompensation + charPenalty + charEndPenalty;
  const details = [
    'Quy tắc: điểm cơ bản 40 + điểm neo ảnh đầu 25 + điểm neo ảnh cuối 25 (khi mô hình không hỗ trợ ảnh cuối thì bù 20 điểm) + phạt thiếu neo nhân vật',
    `Mô hình: ${shot.videoModel || 'chưa được đặt'}, ${supportsEndFrame ? 'hỗ trợ nội suy ảnh cuối' : 'không hỗ trợ nội suy ảnh cuối'}`,
    `Neo ảnh đầu: ${startFrame?.imageUrl ? 'đã cung cấp (+25)' : 'chưa cung cấp (+0)'}`,
    supportsEndFrame
      ? `Neo ảnh cuối: ${endFrame?.imageUrl ? 'đã cung cấp (+25)' : 'chưa cung cấp (+0)'}`
      : 'Neo ảnh cuối: mô hình không hỗ trợ, sử dụng điểm bù (+20)',
    hasCharacters
      ? `Phạt cảnh quay nhân vật: ${!startFrame?.imageUrl ? 'thiếu neo ảnh đầu (-20)' : 'neo ảnh đầu hoàn chỉnh (0)'}${supportsEndFrame && !endFrame?.imageUrl ? '; thiếu neo ảnh cuối (-10)' : ''}`
      : 'Cảnh quay không phải nhân vật: không kích hoạt phạt neo nhân vật',
    `Tổng điểm: ${Math.round(score)}/100`,
  ].join('\n');

  return pickCheck(
    'continuity-risk',
    'Continuity Risk',
    score,
    10,
    details
  );
};

const weightedScore = (checks: QualityCheck[]): number => {
  const weightedSum = checks.reduce((sum, check) => sum + check.score * check.weight, 0);
  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0) || 1;
  return Math.round(weightedSum / totalWeight);
};

const resolveGrade = (score: number): ShotQualityAssessment['grade'] => {
  if (score >= 80) return 'pass';
  if (score >= 60) return 'warning';
  return 'fail';
};

const buildSummary = (checks: QualityCheck[], grade: ShotQualityAssessment['grade']): string => {
  const failedChecks = checks.filter((check) => !check.passed).map((check) => check.label);
  if (!failedChecks.length) {
    return 'Có thể đi vào sản xuất, các mục kiểm tra cốt lõi đã vượt qua.';
  }

  const prefix =
    grade === 'fail'
      ? 'Rủi ro cao: '
      : grade === 'warning'
        ? 'Cần tối ưu hóa: '
        : 'Vấn đề nhẹ: ';
  return `${prefix}${failedChecks.join(', ')}`;
};

export const assessShotQuality = (
  shot: Shot,
  scriptData?: ScriptData | null
): ShotQualityAssessment => {
  const checks: QualityCheck[] = [
    evaluatePromptReadiness(shot),
    evaluateAssetCoverage(shot, scriptData),
    evaluateKeyframeExecution(shot),
    evaluateVideoExecution(shot),
    evaluateContinuity(shot),
  ];

  const score = weightedScore(checks);
  const grade = resolveGrade(score);

  return {
    version: QUALITY_SCHEMA_VERSION,
    score,
    grade,
    generatedAt: Date.now(),
    checks,
    summary: buildSummary(checks, grade),
  };
};

export const getProjectAverageQualityScore = (shots: Shot[]): number => {
  const assessments = shots
    .map((shot) => shot.qualityAssessment)
    .filter((assessment): assessment is ShotQualityAssessment => !!assessment);

  if (!assessments.length) return 0;
  const sum = assessments.reduce((acc, assessment) => acc + assessment.score, 0);
  return Math.round(sum / assessments.length);
};
