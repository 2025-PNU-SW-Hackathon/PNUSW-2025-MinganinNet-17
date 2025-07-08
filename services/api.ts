// API Service for communicating with backend

const API_BASE_URL = 'http://localhost:3001';

export interface APIResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// Send message to Gemini API via backend
export const sendMessage = async (promptType: 'kind' | 'aggressive' | 'boyfriend'): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promptType }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.response || 'No response received';
  } catch (error) {
    console.error('API call failed:', error);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else if (error.message.includes('500')) {
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        throw new Error(`API 호출 중 오류가 발생했습니다: ${error.message}`);
      }
    }
    
    throw new Error('알 수 없는 오류가 발생했습니다.');
  }
};

// Health check endpoint
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};