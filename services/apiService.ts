
/**
 * Robust API Service for Kitetrade PRO
 * Handles timeouts, retries, and consistent error reporting
 */

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 2;

/**
 * Enhanced fetch with timeout and retry logic
 */
export async function secureFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, retries = DEFAULT_RETRIES, ...fetchOptions } = options;

  let lastError: any;
  
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      clearTimeout(id);
      
      // If we get a 5xx error, we might want to retry
      if (response.status >= 500 && i < retries) {
        console.warn(`API request failed with status ${response.status}. Retrying... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        continue;
      }
      
      return response;
    } catch (err: any) {
      clearTimeout(id);
      lastError = err;
      
      if (err.name === 'AbortError') {
        if (i < retries) {
          console.warn(`API request timed out. Retrying... (${i + 1}/${retries})`);
          continue;
        }
        throw new ApiError('Request timed out. Please check your connection.', 408);
      }
      
      if (i < retries) {
        console.warn(`API request network error: ${err.message}. Retrying... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
    }
  }

  throw lastError || new Error('Unknown network error');
}

/**
 * Standardized JSON request helper
 */
export async function apiRequest<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await secureFetch(url, { ...options, headers });
  
  let data: any;
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = (data && typeof data === 'object' && data.error) 
      ? data.error 
      : (typeof data === 'string' && data.length < 100 ? data : `Request failed with status ${response.status}`);
    
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
