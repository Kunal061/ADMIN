// Forgot Password API service

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAddress: email }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Send OTP failed:', data);
      return { success: false, message: data.message || 'Failed to send OTP' };
    }
    
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
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailAddress: email,
        newPassword: newPassword,
        verificationCode: verificationCode,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Reset password failed:', data);
      return { success: false, message: data.message || 'Failed to reset password' };
    }
    
    console.log('Password reset successfully:', data);
    return { success: true, message: data.message || 'Password reset successfully' };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { success: false, message: 'Network error. Please try again.' };
  }
}
