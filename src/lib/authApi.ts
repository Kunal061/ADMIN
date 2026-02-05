// Authentication API service for fetching allowed users

export interface AllowedUser {
  id: string;
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
}

// API configuration from environment variables (required)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

if (!API_BASE_URL || !API_TOKEN) {
  console.error('❌ API configuration missing! Please check .env.local file.');
  console.error('Required: VITE_API_BASE_URL and VITE_API_TOKEN');
}

/**
 * Fetches all users from the external API to use as login allowlist
 * @returns Map of email to user data for quick lookup
 */
export async function fetchAllowedUsers(): Promise<Map<string, AllowedUser>> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` }),
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch allowed users:', response.status, response.statusText);
      
      // Provide specific error messages
      if (response.status === 401) {
        console.error('❌ Token expired or invalid. Please update VITE_API_TOKEN in .env.local');
      }
      
      // Try to get error message from response
      try {
        const errorData = await response.json();
        console.error('API Error:', errorData.message || errorData);
      } catch (e) {
        // Ignore if response body is not JSON
      }
      
      return new Map();
    }

    const data = await response.json();
    console.log('Raw API response:', data);
    
    // Handle nested structure: data.data.data (actual API format)
    const userList = data?.data?.data || data?.data || [];
    console.log(`Found ${Array.isArray(userList) ? userList.length : 0} users in response`);

    // Transform to Map for O(1) lookup by email
    const allowedUsersMap = new Map<string, AllowedUser>();

    userList.forEach((user: any) => {
      // API uses emailAddress field, not email
      const email = (user.emailAddress || user.email)?.toLowerCase();
      if (email) {
        // Transform API user to AllowedUser format
        const allowedUser: AllowedUser = {
          id: (user._id ?? user.id ?? user.cognitoId ?? '').toString(),
          email: email,
          password: user.password || '', // Password might not be in API response
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.mobileNo || user.phone,
          dateOfBirth: user.dob || user.dateOfBirth,
          gender: user.gender,
        };

        allowedUsersMap.set(email, allowedUser);
      }
    });

    console.log(`✅ Loaded ${allowedUsersMap.size} allowed users from API`);
    return allowedUsersMap;

  } catch (error) {
    console.error('Error fetching allowed users:', error);
    return new Map();
  }
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

/**
 * Validates if a user is in the allowlist (email exists)
 * @param email User's email
 * @param allowedUsers Map of allowed users
 * @returns The user data if in allowlist, null otherwise
 */
export function validateUserInAllowlist(
  email: string,
  allowedUsers: Map<string, AllowedUser>
): AllowedUser | null {
  const normalizedEmail = email.toLowerCase().trim();
  return allowedUsers.get(normalizedEmail) || null;
}
