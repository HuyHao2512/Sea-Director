/**
 * Bộ chuyển đổi Chat Model - Gemini Native
 * Xử lý API generateContent của Google Gemini
 */

import { ChatModelDefinition, ChatOptions, ChatModelParams } from '../../types/model';
import { getApiKeyForModel, getApiBaseUrlForModel, getActiveChatModel } from '../modelRegistry';

/**
 * API Key Error Class
 */
export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

/**
 * Retry Operation
 */
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      // Do not retry 400/401/403 errors
      if (error.message?.includes('400') || 
          error.message?.includes('401') || 
          error.message?.includes('403')) {
        throw error;
      }
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

/**
 * Clean JSON Response
 */
const cleanJsonResponse = (response: string): string => {
  let cleaned = response.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/```\s*$/, '');
  return cleaned.trim();
};

/**
 * Call Chat Model API
 */
export const callChatApi = async (
  options: ChatOptions,
  model?: ChatModelDefinition
): Promise<string> => {
  // Get active model
  const activeModel = model || getActiveChatModel();
  if (!activeModel) {
    throw new Error('No available chat model');
  }

  // Get API configuration
  const apiKey = getApiKeyForModel(activeModel.id);
  if (!apiKey) {
    throw new ApiKeyError('Gemini API Key chưa được cấu hình. Vui lòng nhập API Key trong phần cài đặt.');
  }
  
  const apiBase = getApiBaseUrlForModel(activeModel.id);
  const apiModel = activeModel.apiModel || activeModel.id;
  
  // Merge params
  const params: ChatModelParams = {
    ...activeModel.params,
    ...options.overrideParams,
  };
  
  // Build Gemini request body
  const generationConfig: any = {
    temperature: params.temperature,
  };
  if (params.maxTokens !== undefined) {
    generationConfig.maxOutputTokens = params.maxTokens;
  }
  if (params.topP !== undefined) {
    generationConfig.topP = params.topP;
  }
  if (options.responseFormat === 'json') {
    generationConfig.responseMimeType = 'application/json';
  }
  
  // Build contents (Gemini format)
  const parts: any[] = [{ text: options.prompt }];
  
  const requestBody: any = {
    contents: [{ role: 'user', parts }],
    generationConfig,
  };
  
  // System instruction (Gemini uses separate field)
  if (options.systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: options.systemPrompt }]
    };
  }
  
  // Timeout control
  const timeout = options.timeout || 600000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await retryOperation(async () => {
      // Gemini native: ?key= auth
      const url = `${apiBase}/v1beta/models/${apiModel}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      if (!res.ok) {
        let errorMessage = `Lỗi HTTP: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          const errorText = await res.text();
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }
      
      return res;
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    // Gemini response: candidates[0].content.parts[0].text
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (options.responseFormat === 'json') {
      return cleanJsonResponse(content);
    }
    
    return content;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Yêu cầu đã hết thời gian (${timeout / 1000}s)`);
    }
    
    throw error;
  }
};

/**
 * Verify Gemini API Key
 */
export const verifyApiKey = async (apiKey: string, baseUrl?: string): Promise<{ success: boolean; message: string }> => {
  try {
    const url = baseUrl || 'https://generativelanguage.googleapis.com';
    
    const response = await fetch(`${url}/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Return 1 only.' }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 5 },
      }),
    });

    if (!response.ok) {
      let errorMessage = `Verification failed: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // ignore
      }
      return { success: false, message: errorMessage };
    }

    const data = await response.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text !== undefined) {
      return { success: true, message: 'Gemini API Key verified successfully!' };
    } else {
      return { success: false, message: 'Response format incorrect.' };
    }
  } catch (error: any) {
    return { success: false, message: error.message || 'Lỗi mạng' };
  }
};
