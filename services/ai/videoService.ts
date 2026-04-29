/**
 * Video Generation Service - Gemini Veo
 * Hỗ trợ Veo 2 (predictLongRunning) và Veo 3.1 Flash (generateContent)
 */

import { AspectRatio, VideoDuration } from "../../types";
import {
  retryOperation,
  checkApiKey,
  getApiBase,
  resolveModel,
  resolveRequestModel,
  parseHttpError,
  convertVideoUrlToBase64,
} from './apiCore';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com';

// ============================================
// Helper: Convert video URL to base64 with fallback
// ============================================

const tryConvertVideoUrlToBase64 = async (
  videoUrl: string,
  label: string
): Promise<string> => {
  try {
    const videoBase64 = await convertVideoUrlToBase64(videoUrl);
    console.log(`✅ ${label} video đã chuyển sang base64`);
    return videoBase64;
  } catch (error: any) {
    const message = error?.message || String(error);
    console.warn(`⚠️ ${label} chuyển base64 thất bại, dùng URL gốc: ${message}`);
    return videoUrl;
  }
};

/** Thêm API key vào URL Gemini nếu chưa có */
const appendApiKey = (url: string, apiKey: string): string => {
  if (!url || !apiKey) return url;
  if (url.includes('key=')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}key=${apiKey}`;
};

// ============================================
// Gemini Veo 2 - Video Generation (Long-running operation)
// ============================================

/**
 * Tạo video bằng Gemini Veo 2 API
 * Flow: 
 *   1. POST /v1beta/models/veo-2:predictLongRunning?key={key} -> operation name
 *   2. GET /v1beta/{operation_name}?key={key} -> poll until done
 *   3. Extract video URI from result
 */
const generateVideoGeminiVeo = async (
  prompt: string,
  startImageBase64: string | undefined,
  apiKey: string,
  apiBase: string,
  aspectRatio: AspectRatio = '16:9',
  duration: VideoDuration = 8,
  modelName: string = 'veo-2'
): Promise<string> => {
  console.log(`🎬 Gemini Veo 2: Bắt đầu tạo video (${aspectRatio}, ${duration}s)...`);

  // Build request body for Veo 2
  const instances: any = {
    prompt: prompt,
  };

  // Add reference image if provided
  if (startImageBase64) {
    const cleanBase64 = startImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    instances.image = {
      bytesBase64Encoded: cleanBase64,
      mimeType: 'image/png',
    };
  }

  const parameters: any = {
    aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
    personGeneration: 'allow_all',
  };

  if (duration) {
    parameters.durationSeconds = duration;
  }

  const requestBody = {
    instances: [instances],
    parameters: parameters,
  };

  // Step 1: Start long-running video generation
  const createUrl = `${apiBase}/v1beta/models/${modelName}:predictLongRunning?key=${apiKey}`;

  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!createResponse.ok) {
    if (createResponse.status === 400) {
      throw new Error('Prompt có thể chứa nội dung không an toàn. Vui lòng chỉnh sửa và thử lại.');
    }
    if (createResponse.status === 429) {
      throw new Error('Đã vượt quá giới hạn request. Vui lòng đợi và thử lại sau.');
    }
    if (createResponse.status >= 500) {
      throw new Error('Máy chủ Gemini đang bận. Vui lòng thử lại sau.');
    }
    throw await parseHttpError(createResponse);
  }

  const createData = await createResponse.json();
  const operationName = createData.name;

  if (!operationName) {
    throw new Error('Tạo video thất bại: Không nhận được operation ID từ Gemini.');
  }

  console.log('📋 Gemini Veo 2: Operation đã tạo:', operationName);

  // Step 2: Poll operation status
  const maxPollingTime = 1200000; // 20 phút
  const pollingInterval = 10000; // 10 giây
  const startTime = Date.now();

  while (Date.now() - startTime < maxPollingTime) {
    await new Promise(resolve => setTimeout(resolve, pollingInterval));

    const statusUrl = `${apiBase}/v1beta/${operationName}?key=${apiKey}`;
    const statusResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!statusResponse.ok) {
      console.warn('⚠️ Truy vấn trạng thái thất bại, tiếp tục...');
      continue;
    }

    const statusData = await statusResponse.json();

    console.log(`🔄 Gemini Veo 2 trạng thái: done=${statusData.done || false}`);

    if (statusData.done) {
      // Check for error in response
      if (statusData.error) {
        const errorMsg = statusData.error.message || statusData.error.code || 'Lỗi không xác định';
        throw new Error(`Tạo video thất bại: ${errorMsg}`);
      }

      // Extract video from response
      const response = statusData.response;
      if (!response) {
        throw new Error('Tạo video hoàn tất nhưng không có dữ liệu phản hồi.');
      }

      // Xử lý format custom: {"code": 0, "message": "success", "data": {"taskId": "...", "outputVideoUrls": [...]}}
      if (response.code === 0 && response.data?.outputVideoUrls && Array.isArray(response.data.outputVideoUrls)) {
        const videoUrl = response.data.outputVideoUrls[0];
        console.log('✅ Gemini Veo 2: Video đã tạo, URL:', videoUrl);
        return videoUrl;
      }

      // Veo returns predictions with video URI or bytes
      const predictions = response.predictions || [];
      if (predictions.length > 0) {
        const prediction = predictions[0];

        // Check for video bytes (base64)
        if (prediction.bytesBase64Encoded) {
          const mimeType = prediction.mimeType || 'video/mp4';
          const result = `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;
          console.log('✅ Gemini Veo 2: Video đã tạo thành công (base64)');
          return result;
        }

        // Check for video URI
        if (prediction.videoUri || prediction.uri) {
          const videoUrl = appendApiKey(prediction.videoUri || prediction.uri, apiKey);
          console.log('✅ Gemini Veo 2: Video đã tạo, URI:', videoUrl);
          return tryConvertVideoUrlToBase64(videoUrl, 'Gemini Veo 2');
        }
      }

      // Fallback: try to find video in generateVideoResponse format
      const videos = response.generateVideoResponse?.generatedSamples || [];
      if (videos.length > 0) {
        const videoUri = videos[0].video?.uri;
        if (videoUri) {
          const videoUrl = appendApiKey(videoUri, apiKey);
          console.log('✅ Gemini Veo 2: Video URI:', videoUrl);
          return tryConvertVideoUrlToBase64(videoUrl, 'Gemini Veo 2');
        }
      }

      throw new Error('Tạo video hoàn tất nhưng không tìm thấy URL/dữ liệu video.');
    }

    // Check for partial metadata/progress
    if (statusData.metadata) {
      const progress = statusData.metadata.progress || statusData.metadata.percentComplete;
      if (progress !== undefined) {
        console.log(`📊 Tiến độ: ${progress}%`);
      }
    }
  }

  throw new Error('Tạo video hết thời gian chờ (20 phút).');
};

// ============================================
// Gemini generateContent cho video đơn giản
// (Dùng model gemini-2.0-flash với text prompt để tạo video)
// ============================================

/**
 * Fallback: Dùng generateContent với video output
 * Một số model Gemini hỗ trợ output video trực tiếp
 */
const generateVideoViaGenerateContent = async (
  prompt: string,
  startImageBase64: string | undefined,
  apiKey: string,
  apiBase: string,
  aspectRatio: AspectRatio = '16:9',
  duration: VideoDuration = 8,
  modelName: string = 'veo-2'
): Promise<string> => {
  console.log(`🎬 Gemini Video (generateContent fallback): ${modelName}...`);

  const parts: any[] = [{ text: `Generate a ${duration}-second video with ${aspectRatio} aspect ratio. ${prompt}` }];

  if (startImageBase64) {
    const match = startImageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }

  const requestBody = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['VIDEO', 'TEXT'],
    },
  };

  const url = `${apiBase}/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await retryOperation(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      throw await parseHttpError(res);
    }

    return await res.json();
  });

  // Parse response
  const candidates = response.candidates || [];
  if (candidates.length > 0 && candidates[0].content?.parts) {
    for (const part of candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('video/')) {
        const result = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        console.log('✅ Video đã tạo thành công qua generateContent');
        return result;
      }
      if (part.fileData?.fileUri) {
        return tryConvertVideoUrlToBase64(part.fileData.fileUri, 'Gemini');
      }
    }
  }

  throw new Error('Tạo video thất bại: Không có dữ liệu video trong phản hồi.');
};

// ============================================
// Unified Video Generation Entry Point
// ============================================

/**
 * Veo 3.1 Flash — predictLongRunning với instances/parameters format
 * POST /v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning
 */
const generateVideoVeo31Flash = async (
  prompt: string,
  startImageBase64: string | undefined,
  apiKey: string,
  apiBase: string,
  aspectRatio: AspectRatio = '16:9',
  duration: VideoDuration = 8,
): Promise<string> => {
  console.log(`🎬 Veo 3.1 Flash: Bắt đầu tạo video (${aspectRatio}, ${duration}s)...`);

  const instance: any = { prompt };

  if (startImageBase64) {
    const match = startImageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (match) {
      instance.image = { bytesBase64Encoded: match[2], mimeType: match[1] };
    }
  }

  const requestBody = {
    instances: [instance],
    parameters: { durationSeconds: duration, aspectRatio },
  };

  // Step 1: Start long-running operation
  const createUrl = `${apiBase}/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning?key=${apiKey}`;
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!createResponse.ok) throw await parseHttpError(createResponse);

  const createData = await createResponse.json();
  const operationName = createData.name;
  if (!operationName) throw new Error('Veo 3.1 Flash: Không nhận được operation ID.');

  console.log('📋 Veo 3.1 Flash: Operation:', operationName);

  // Step 2: Poll until done
  const maxPollingTime = 1200000;
  const pollingInterval = 10000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxPollingTime) {
    await new Promise(resolve => setTimeout(resolve, pollingInterval));

    const statusUrl = `${apiBase}/v1beta/${operationName}?key=${apiKey}`;
    const statusResponse = await fetch(statusUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });

    if (!statusResponse.ok) { console.warn('⚠️ Truy vấn trạng thái thất bại, tiếp tục...'); continue; }

    const statusData = await statusResponse.json();
    console.log(`🔄 Veo 3.1 Flash: done=${statusData.done || false}`);

    if (!statusData.done) {
      const progress = statusData.metadata?.progress || statusData.metadata?.percentComplete;
      if (progress !== undefined) console.log(`📊 Tiến độ: ${progress}%`);
      continue;
    }

    if (statusData.error) throw new Error(`Veo 3.1 Flash thất bại: ${statusData.error.message || statusData.error.code}`);

    const response = statusData.response;
    if (!response) throw new Error('Veo 3.1 Flash: Không có dữ liệu phản hồi.');

    // Format custom
    if (response.code === 0 && response.data?.outputVideoUrls?.length > 0) {
      console.log('✅ Veo 3.1 Flash: Video URL:', response.data.outputVideoUrls[0]);
      return response.data.outputVideoUrls[0];
    }

    // Format Gemini predictions
    const predictions = response.predictions || [];
    if (predictions.length > 0) {
      const p = predictions[0];
      if (p.bytesBase64Encoded) return `data:${p.mimeType || 'video/mp4'};base64,${p.bytesBase64Encoded}`;
      if (p.videoUri || p.uri) {
        const videoUrl = appendApiKey(p.videoUri || p.uri, apiKey);
        return tryConvertVideoUrlToBase64(videoUrl, 'Veo 3.1 Flash');
      }
    }

    const videos = response.generateVideoResponse?.generatedSamples || [];
    if (videos.length > 0 && videos[0].video?.uri) {
      const videoUrl = appendApiKey(videos[0].video.uri, apiKey);
      return tryConvertVideoUrlToBase64(videoUrl, 'Veo 3.1 Flash');
    }

    throw new Error('Veo 3.1 Flash: Không tìm thấy dữ liệu video trong phản hồi.');
  }

  throw new Error('Veo 3.1 Flash: Hết thời gian chờ (20 phút).');
};

export const generateVideo = async (
  prompt: string,
  startImageBase64?: string,
  endImageBase64?: string,
  model: string = 'veo_3_1-fast',
  aspectRatio: AspectRatio = '16:9',
  duration: VideoDuration = 8
): Promise<string> => {
  const requestModel = resolveRequestModel('video', model) || model;
  const apiKey = checkApiKey('video', model);
  const apiBase = getApiBase('video', model);

  console.log(`🎬 Tạo video: model=${requestModel}, ratio=${aspectRatio}, duration=${duration}s`);

  const referenceImage = startImageBase64 || undefined;

  // Veo 3.1 Flash — dùng generateContent
  const isVeo31 = requestModel.toLowerCase().includes('veo_3_1') ||
    requestModel.toLowerCase().includes('veo-3.1') ||
    requestModel.toLowerCase() === 'veo_3_1-fast';

  if (isVeo31) {
    return generateVideoVeo31Flash(
      prompt,
      referenceImage,
      apiKey,
      apiBase,
      aspectRatio,
      duration,
    );
  }

  // Veo 2 — dùng predictLongRunning
  try {
    return await generateVideoGeminiVeo(
      prompt,
      referenceImage,
      apiKey,
      apiBase,
      aspectRatio,
      duration,
      requestModel
    );
  } catch (error: any) {
    console.warn(`⚠️ Veo predictLongRunning thất bại: ${error.message}. Thử generateContent fallback...`);
  }

  return generateVideoViaGenerateContent(
    prompt,
    referenceImage,
    apiKey,
    apiBase,
    aspectRatio,
    duration,
    requestModel
  );
};
