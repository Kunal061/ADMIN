// Authentication API service

// API configuration from environment variables (required)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

if (!API_BASE_URL || !API_TOKEN) {
  console.error('❌ API configuration missing! Please check .env.local file.');
  console.error('Required: VITE_API_BASE_URL and VITE_API_TOKEN');
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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailAddress: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Login failed:', response.status, data.message || response.statusText);
      return { success: false, message: data.message || 'Login failed' };
    }

    console.log('Login successful:', data);
    
    // Handle nested structure: data.data.data
    const loginData = data?.data?.data || data?.data || data;
    return { 
      success: true, 
      user: loginData.user, 
      token: loginData.token 
    };

  } catch (error) {
    console.error('Error during login:', error);
    return { success: false, message: 'Network error during login' };
  }
}
