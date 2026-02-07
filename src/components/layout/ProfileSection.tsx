import { useState, useRef, useEffect } from 'react';
import { User, Lock, Save, X, LogOut, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { resetPassword, sendOtp } from '@/lib/forgotPasswordApi';
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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');
  const API_TOKEN = import.meta.env.VITE_API_TOKEN || import.meta.env.VITE_API_REFRESH_TOKEN;

  const getAuthToken = () => {
    if (API_TOKEN) return API_TOKEN;
    try {
      return localStorage.getItem('roamana_api_token');
    } catch {
      return null;
    }
  };

  const handleSaveName = async () => {
    const combinedName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    if (!combinedName) return;
    const token = getAuthToken();
    if (!API_BASE_URL || !token || !currentUser.id) {
      showToast('Unable to update name. Missing API configuration.', 'error');
      return;
    }
    setNameSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
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
        <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0">
          <div className="p-6 text-white" style={tealStyle}>
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
          <div className="p-6 space-y-6">
            {/* Edit Name */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <User className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900 font-heading">Change Name</h3>
              </div>
              <div className="space-y-3 pl-7">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-first-name" className="text-sm">First Name</Label>
                      <Input
                        id="profile-first-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="border-gray-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="profile-last-name" className="text-sm">Last Name</Label>
                      <Input
                        id="profile-last-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSaveName}
                      disabled={!firstName.trim() && !lastName.trim()}
                      className="h-9 px-4 text-sm text-white font-medium"
                      style={tealStyle}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {nameSaving ? 'Saving...' : 'Save'}
                    </Button>
                    {(firstName.trim() || lastName.trim()) &&
                      [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') !== currentUser.name && (
                      <Button
                        onClick={() => {
                          const nameParts = currentUser.name.split(' ').filter(Boolean);
                          setFirstName(nameParts[0] || '');
                          setLastName(nameParts.slice(1).join(' '));
                        }}
                        className="h-9 px-4 text-sm text-white font-medium hover:opacity-90 border-0"
                        style={tealStyle}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <Lock className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900 font-heading">Change Password</h3>
              </div>
              <div className="space-y-3 pl-7">
                <p className="text-sm text-gray-500">
                  For security, we recommend changing your password regularly.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-otp" className="text-gray-700">OTP</Label>
                    <div className="flex items-center gap-2">
                      {otpSent && (
                        <Input
                          id="profile-otp"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter OTP"
                          className="border-gray-200 flex-1"
                        />
                      )}
                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        className="h-9 px-4 text-sm text-white font-medium"
                        style={tealStyle}
                        disabled={otpLoading}
                      >
                        {otpLoading ? 'Sending...' : 'Send OTP'}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-new-password" className="text-gray-700">New Password</Label>
                    <Input
                      id="profile-new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-confirm-password" className="text-gray-700">Confirm New Password</Label>
                    <Input
                      id="profile-confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-gray-200"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{passwordError}</p>
                  )}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleResetPassword}
                      className="h-9 px-4 text-sm text-white font-medium"
                      style={tealStyle}
                    >
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
