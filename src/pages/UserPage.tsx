import { useState, useRef } from 'react';
import { Camera, User, Phone, Lock, Save, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function UserPage() {
  const { currentUser, updateUser, updateProfilePhoto } = useApp();
  const [name, setName] = useState(currentUser.name);
  const [emergencyContact, setEmergencyContact] = useState(currentUser.emergencyContact);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfilePhoto(reader.result as string);
        showSuccess('Profile photo updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = () => {
    if (name.trim()) {
      updateUser({ name: name.trim() });
      showSuccess('Name updated successfully!');
    }
  };

  const handleSaveEmergencyContact = () => {
    if (emergencyContact.trim()) {
      updateUser({ emergencyContact: emergencyContact.trim() });
      showSuccess('Emergency contact updated!');
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
    
    // Simulate password reset
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setDialogOpen(false);
    showSuccess('Password reset successfully!');
  };

  const showSuccess = (message: string) => {
    setSaveSuccess(message);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">Manage user profile settings and preferences</p>
      </div>

      {/* Success notification */}
      {saveSuccess && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg">
            <Save className="h-4 w-4" />
            {saveSuccess}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Photo */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6" />
              <div>
                <CardTitle className="text-white">Profile Photo</CardTitle>
                <CardDescription className="text-blue-100">
                  Upload or change your profile picture
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                  <AvatarImage src={currentUser.profilePhoto || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-4xl">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                >
                  <Camera className="h-8 w-8 text-white" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Click on the avatar to upload a new photo
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supports JPG, PNG, GIF up to 5MB
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Choose Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edit Name */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6" />
              <div>
                <CardTitle className="text-white">Edit Name</CardTitle>
                <CardDescription className="text-cyan-100">
                  Update your display name
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
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
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Name
                </Button>
                {name !== currentUser.name && (
                  <Button
                    variant="outline"
                    onClick={() => setName(currentUser.name)}
                    className="border-cyan-500 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white">
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6" />
              <div>
                <CardTitle className="text-white">Emergency Contact</CardTitle>
                <CardDescription className="text-blue-100">
                  Update your emergency contact information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergency">Emergency Contact Number</Label>
                <Input
                  id="emergency"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="border-gray-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSaveEmergencyContact}
                  disabled={!emergencyContact.trim() || emergencyContact === currentUser.emergencyContact}
                  className="bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Contact
                </Button>
                {emergencyContact !== currentUser.emergencyContact && (
                  <Button
                    variant="outline"
                    onClick={() => setEmergencyContact(currentUser.emergencyContact)}
                    className="border-blue-400 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reset Password */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6" />
              <div>
                <CardTitle className="text-white">Reset Password</CardTitle>
                <CardDescription className="text-cyan-100">
                  Change your account password
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                For security, we recommend changing your password regularly.
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600">
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md overflow-hidden p-0">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white text-xl flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                      </DialogTitle>
                      <DialogDescription className="text-blue-100">
                        Enter your current password and choose a new one.
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="text-gray-700">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-gray-700">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-gray-700">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="border-gray-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                    {passwordError && (
                      <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg">{passwordError}</p>
                    )}
                  </div>
                  <DialogFooter className="p-6 pt-0 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                      className="border-blue-400 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleResetPassword}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                    >
                      Update Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
