// Authentication API service

import { apiClient, getApiBaseUrl } from '@/lib/apiClient';

const API_BASE_URL = getApiBaseUrl();

if (!API_BASE_URL) {
  console.error('❌ API configuration missing! Please check .env.local file.');
  console.error('Required: VITE_API_BASE_URL');
}

/**
 * Calls the login API endpoint to validate credentials
 * @param email User's email
 * @param password User's password
 * @returns Login response data if successful, null otherwise
 */
export async function loginWithCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; user?: any; token?: string; message?: string }> {
  try {
    const response = await apiClient.post('/auth/login', {
      emailAddress: email,
      password: password,
    });
    const data = response.data;

    console.log('Login successful:', data);
    
    // Handle nested structure: data.data.data
    const loginData = data?.data?.data || data?.data || data;
    return {
      success: true,
      user: loginData.user,
      token: loginData.token,
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error during login';
    console.error('Error during login:', message);
    return { success: false, message };
  }
}
