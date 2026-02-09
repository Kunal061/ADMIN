import { useState, useRef, useEffect } from 'react';
import { User, Lock, Save, LogOut, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { resetPassword, sendOtp } from '@/lib/forgotPasswordApi';
import { apiClient, getApiBaseUrl } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const tealStyle = { backgroundColor: '#06B3C4' };

export function ProfileSection() {
  const { currentUser, updateUser, logout, showToast } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [firstName, setFirstName] = useState(currentUser.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(currentUser.name.split(' ').slice(1).join(' '));
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  const API_BASE_URL = getApiBaseUrl();

  const handleSaveName = async () => {
    const combinedName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!combinedName) return;
    if (!API_BASE_URL || !currentUser.id) {
      showToast('Unable to update name. Missing API configuration.', 'error');
      return;
    }
    setNameSaving(true);
    try {
      const response = await apiClient.put(`/admin/users/${currentUser.id}`, {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data?.message || data?.error || 'Failed to update name');
      }
      updateUser({ name: combinedName });
      showToast('Name updated successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update name';
      showToast(message, 'error');
    } finally {
      setNameSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setPasswordError('');
    if (!otpSent) {
      setPasswordError('Please send an OTP to continue.');
      return;
    }
    if (!otpCode.trim()) {
      setPasswordError('Please enter the OTP sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    const result = await resetPassword(currentUser.email, otpCode.trim(), newPassword);
    if (!result.success) {
      setPasswordError(result.message || 'Failed to reset password.');
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setOtpSent(false);
    showToast(result.message || 'Password reset successfully!');
  };

  const handleSendOtp = async () => {
    setPasswordError('');
    setOtpLoading(true);
    const result = await sendOtp(currentUser.email);
    if (result.success) {
      setOtpSent(true);
      showToast(result.message || 'OTP sent successfully!');
    } else {
      setPasswordError(result.message || 'Failed to send OTP.');
    }
    setOtpLoading(false);
  };

  const openAccountSettings = () => {
    const nameParts = currentUser.name.split(' ').filter(Boolean);
    setFirstName(nameParts[0] || '');
    setLastName(nameParts.slice(1).join(' '));
    setOtpSent(false);
    setOtpCode('');
    setPasswordError('');
    setNewPassword('');
    setConfirmPassword('');
    setProfileOpen(true);
    setDropdownOpen(false);
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <>
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-opacity hover:opacity-90 w-auto shrink-0 text-left border-0"
          style={{ backgroundColor: '#06B3C4' }}
        >
          <Avatar className="h-10 w-10 shrink-0 border-2 border-white">
            <AvatarImage src={currentUser.profilePhoto || ''} />
            <AvatarFallback style={{ backgroundColor: '#06B3C4', color: '#FFFFFF' }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 max-w-[180px]">
            <p className="text-sm font-medium text-white truncate">
              {currentUser.name}
            </p>
            <p className="text-xs truncate text-white/80">
              {currentUser.email}
            </p>
          </div>
        </button>
        {dropdownOpen && (
          <div
            className="profile-dropdown-panel absolute left-0 right-0 top-full mt-0 w-full rounded-t-none rounded-b-lg border border-gray-200 shadow-lg z-50 py-1"
            style={{ backgroundColor: '#ffffff' }}
          >
            <button
              type="button"
              onClick={openAccountSettings}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 transition-colors"
              style={{ backgroundColor: '#ffffff', color: '#111827' }}
            >
              <Settings className="h-4 w-4 text-gray-800" />
              Account Setting
            </button>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 transition-colors"
              style={{ backgroundColor: '#ffffff', color: '#111827' }}
            >
              <LogOut className="h-4 w-4 text-gray-800" />
              Logout
            </button>
          </div>
        )}
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-lg overflow-hidden p-0 gap-0">
          <div className="px-6 pt-6 pb-4 text-white" style={tealStyle}>
            <DialogHeader>
              <DialogTitle className="text-white text-xl flex items-center gap-2 font-heading">
                <User className="h-5 w-5" />
                Account Settings
              </DialogTitle>
              <DialogDescription style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Change your name or password
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 pb-8 space-y-6">
            {/* Edit Name */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 mb-4 border-b-2 border-gray-100">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50">
                  <User className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Change Name</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-first-name" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <Input
                      id="profile-first-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      className="h-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-last-name" className="text-sm font-medium text-gray-700">
                      Last Name
                    </Label>
                    <Input
                      id="profile-last-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      className="h-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleSaveName}
                    disabled={(!firstName.trim() && !lastName.trim()) || nameSaving}
                    className="h-10 px-5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    style={tealStyle}
                  >
                    {nameSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  {(firstName.trim() || lastName.trim()) &&
                    [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') !== currentUser.name && (
                    <Button
                      onClick={() => {
                        const nameParts = currentUser.name.split(' ').filter(Boolean);
                        setFirstName(nameParts[0] || '');
                        setLastName(nameParts.slice(1).join(' '));
                      }}
                      variant="outline"
                      className="h-10 px-5 text-sm font-medium border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 mb-4 border-b-2 border-gray-100">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50">
                  <Lock className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
              </div>
              <p className="text-sm text-gray-500">
                For security, we recommend changing your password regularly.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-otp" className="text-sm font-medium text-gray-700">
                    Verification Code
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="profile-otp"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder={otpSent ? "Enter 6-digit code" : "Click 'Send Code' first"}
                      disabled={!otpSent}
                      className="h-10 flex-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || otpSent}
                      className="h-10 px-5 text-sm font-medium text-white whitespace-nowrap"
                      style={tealStyle}
                    >
                      {otpLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : otpSent ? (
                        <>Code Sent</>
                      ) : (
                        <>Send Code</>
                      )}
                    </Button>
                  </div>
                  {otpSent && (
                    <p className="text-xs text-teal-600 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verification code sent to your email
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-new-password" className="text-sm font-medium text-gray-700">
                    New Password
                  </Label>
                  <Input
                    id="profile-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="h-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                  {newPassword && (
                    <p className={`text-xs flex items-center gap-1.5 ${
                      newPassword.length >= 6 ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {newPassword.length >= 6 ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Password meets requirements
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Password must be at least 6 characters
                        </>
                      )}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-confirm-password" className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </Label>
                  <Input
                    id="profile-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="h-10 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                  {confirmPassword && (
                    <p className={`text-xs flex items-center gap-1.5 ${
                      newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {newPassword === confirmPassword ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Passwords match
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Passwords do not match
                        </>
                      )}
                    </p>
                  )}
                </div>
                {passwordError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-700 mt-1">{passwordError}</p>
                    </div>
                  </div>
                )}
                <Button
                  onClick={handleResetPassword}
                  disabled={!otpSent || !otpCode.trim() || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="w-full h-11 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={tealStyle}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
