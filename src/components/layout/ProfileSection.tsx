import { useState, useRef, useEffect } from 'react';
import { User, Lock, Save, X, LogOut, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { storage } from '@/lib/storage';
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
const tealBorderStyle = { borderColor: '#06B3C4', color: '#06B3C4' };

export function ProfileSection() {
  const { currentUser, updateUser, logout, showToast } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSaveName = () => {
    if (name.trim()) {
      updateUser({ name: name.trim() });
      showToast('Name updated successfully!');
    }
  };

  const handleResetPassword = () => {
    setPasswordError('');
    if (currentPassword.length < 6) {
      setPasswordError('Current password must be at least 6 characters');
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
    storage.updateRegisteredUserInfo(currentUser.email, { password: newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password reset successfully!');
  };

  const openAccountSettings = () => {
    setName(currentUser.name);
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
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name" className="text-sm">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="border-gray-200"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveName}
                    disabled={!name.trim() || name === currentUser.name}
                    className="h-9 px-4 text-sm text-white font-medium"
                    style={tealStyle}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  {name !== currentUser.name && (
                    <Button
                      onClick={() => setName(currentUser.name)}
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
                    <Label htmlFor="profile-current-password" className="text-gray-700">Current Password</Label>
                    <Input
                      id="profile-current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-gray-200"
                    />
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
