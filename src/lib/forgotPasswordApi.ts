// Forgot Password API service

import { apiClient, getApiBaseUrl } from '@/lib/apiClient';

const API_BASE_URL = getApiBaseUrl();

if (!API_BASE_URL) {
  console.error('❌ API configuration missing! Please check .env.local file.');
}

/**
 * Sends OTP to user's email for password reset
 * @param email User's email address
 * @returns Success/failure result with message
 */
export async function sendOtp(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.post('/auth/send-otp', { emailAddress: email });
    const data = response.data;
    
    console.log('OTP sent successfully:', data);
    return { success: true, message: data.message || 'OTP sent successfully to your email' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
}

/**
 * Resets user password using OTP verification
 * @param email User's email address
 * @param verificationCode OTP code received via email
 * @param newPassword New password to set
 * @returns Success/failure result with message
 */
export async function resetPassword(
  email: string,
  verificationCode: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.post('/auth/reset-password', {
      emailAddress: email,
      newPassword: newPassword,
      verificationCode: verificationCode,
    });
    const data = response.data;
    
    console.log('Password reset successfully:', data);
    return { success: true, message: data.message || 'Password reset successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error. Please try again.';
    console.error('Error resetting password:', message);
    return { success: false, message };
  }
}
