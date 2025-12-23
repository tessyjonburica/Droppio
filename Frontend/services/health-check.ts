import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface HealthCheckResult {
  isHealthy: boolean;
  message: string;
  apiUrl: string;
}

/**
 * Check if the backend server is running and accessible
 */
export async function checkServerHealth(): Promise<HealthCheckResult> {
  try {
    const response = await axios.get(`${API_URL}/health`, {
      timeout: 5000, // 5 second timeout for health check
    });
    
    if (response.status === 200 && response.data?.status === 'ok') {
      return {
        isHealthy: true,
        message: 'Server is running and accessible',
        apiUrl: API_URL,
      };
    }
    
    return {
      isHealthy: false,
      message: 'Server responded but health check failed',
      apiUrl: API_URL,
    };
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      return {
        isHealthy: false,
        message: `Cannot connect to server at ${API_URL}. Make sure the backend server is running on port 5000.`,
        apiUrl: API_URL,
      };
    }
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        isHealthy: false,
        message: `Server at ${API_URL} is not responding. It may be starting up or experiencing issues.`,
        apiUrl: API_URL,
      };
    }
    
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return {
        isHealthy: false,
        message: `Network error: Cannot reach server at ${API_URL}. Check your internet connection and ensure the server is running.`,
        apiUrl: API_URL,
      };
    }
    
    return {
      isHealthy: false,
      message: `Server health check failed: ${error.message}`,
      apiUrl: API_URL,
    };
  }
}

