import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../utils/constants';

/**
 * API Service - Using Fetch (No Axios)
 * Handles all HTTP requests to backend
 * Based on TrueApp pattern but using native fetch
 */

// Logout callback - will be set by UserContext
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

/**
 * Get stored JWT token
 */
const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Handle API response
 */
const handleResponse = async (response: Response) => {
  // Handle 401 (unauthorized) - auto logout
  if (response.status === 401 && logoutCallback) {
    logoutCallback();
    throw new Error('Session expired. Please login again.');
  }

  // Parse JSON response
  const data = await response.json();

  // Handle non-200 responses
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
};

/**
 * GET Request
 */
const get = async (url: string): Promise<any> => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error('GET error:', error);
    throw error;
  }
};

/**
 * POST Request
 */
const post = async (url: string, data?: any): Promise<any> => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error('POST error:', error);
    throw error;
  }
};

/**
 * PUT Request
 */
const put = async (url: string, data?: any): Promise<any> => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error('PUT error:', error);
    throw error;
  }
};

/**
 * DELETE Request
 */
const deleteRequest = async (url: string): Promise<any> => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error('DELETE error:', error);
    throw error;
  }
};

/**
 * Upload File (FormData)
 */
const upload = async (url: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<any> => {
  try {
    const token = await getToken();
    
    const response = await fetch(`${API_URL}${url}`, {
      method: method,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    return await handleResponse(response);
  } catch (error: any) {
    console.error('UPLOAD error:', error);
    throw error;
  }
};

// Export API service object
export const apiService = {
  get,
  post,
  put,
  delete: deleteRequest,
  upload,
};

export default apiService;
