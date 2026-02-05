import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { storage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

type ForgotStep = 'login' | 'requestOtp' | 'resetPassword' | 'success';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isLoadingAllowlist, allowlistError, retryFetchAllowlist } = useApp();
  const navigate = useNavigate();

  // Forgot password flow
  const [forgotStep, setForgotStep] = useState<ForgotStep>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const goBackToLogin = () => {
    setForgotStep('login');
    setForgotEmail('');
    setForgotError('');
    setDevOtp('');
    setOtpInput('');
    setOtpVerified(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    const emailToUse = forgotEmail.trim() || email.trim();
    if (!emailToUse) {
      setForgotError('Please enter your email.');
      setForgotLoading(false);
      return;
    }
    const result = storage.requestPasswordResetOtp(emailToUse);
    setForgotLoading(false);
    if (result.success) {
      setForgotEmail(emailToUse);
      setDevOtp(result.otp ?? '');
      setOtpVerified(false);
      setForgotStep('resetPassword');
    } else {
      setForgotError(result.error ?? 'Something went wrong.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!otpInput.trim()) {
      setForgotError('Please enter the OTP.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setForgotLoading(true);
    const result = storage.verifyOtpAndResetPassword(forgotEmail, otpInput, newPassword);
    setForgotLoading(false);
    if (result.success) {
      setForgotStep('success');
    } else {
      setForgotError(result.error ?? 'Something went wrong.');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!otpInput.trim()) {
      setForgotError('Please enter the OTP.');
      return;
    }
    setForgotLoading(true);
    const result = storage.verifyOtp(forgotEmail, otpInput);
    setForgotLoading(false);
    if (result.success) {
      setOtpVerified(true);
    } else {
      setForgotError(result.error ?? 'Something went wrong.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!email) {
      setError('Please enter your email');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const success = await login(email, password);
    if (success) {
      navigate('/users');
    } else {
      setError('Invalid credentials');
    }
    setIsLoading(false);
  };

  const tealButtonStyle = { backgroundColor: '#06B3C4', color: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden font-sans" style={{ backgroundColor: '#06B3C4' }}>
      <Card className="w-full max-w-md relative border-0 animate-in zoom-in-95 duration-500" style={{ border: 'none', boxShadow: '0 0 24px rgba(0, 0, 0, 0.08)', backgroundColor: 'white' }}>
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img
              src="/roamana-logo.png"
              alt="Roamana"
              className="h-20 w-auto object-contain"
            />
          </div>
          <CardDescription className="text-gray-700 font-sans font-bold">
            {forgotStep === 'login' && 'Sign in to your account'}
            {forgotStep === 'requestOtp' && 'Reset password'}
            {forgotStep === 'resetPassword' && 'Set new password'}
            {forgotStep === 'success' && 'Password reset'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {forgotStep === 'login' && (
            <>
              {/* Allowlist Loading Indicator */}
              {isLoadingAllowlist && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-800/30 border-t-blue-800 rounded-full animate-spin" />
                  <span>Loading user authentication...</span>
                </div>
              )}

              {/* Allowlist Error Banner */}
              {allowlistError && !isLoadingAllowlist && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>⚠️ {allowlistError}</span>
                    </div>
                    <Button
                      type="button"
                      onClick={retryFetchAllowlist}
                      size="sm"
                      className="h-7 px-3 text-xs text-white hover:opacity-90"
                      style={{ backgroundColor: '#06B3C4' }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white border-gray-200"
                    style={{ focusBorderColor: '#03A9F4', focusRingColor: '#03A9F4' }}
                  />
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-14 bg-white border-gray-200"
                      style={{ focusBorderColor: '#03A9F4', focusRingColor: '#03A9F4' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-transparent! text-black! hover:text-gray-600! transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setForgotStep('requestOtp'); setForgotEmail(email); setForgotError(''); }}
                  className="mt-1.5 block w-full text-left text-sm text-[#06B3C4] hover:underline cursor-pointer transition-colors bg-transparent! border-0 p-0 min-w-0 rounded-none font-normal"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-in shake duration-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || isLoadingAllowlist}
                className="w-full shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:scale-[1.02] font-medium"
                style={tealButtonStyle}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2" style={{ color: 'white' }}>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : isLoadingAllowlist ? (
                  <div className="flex items-center gap-2" style={{ color: 'white' }}>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center gap-2" style={{ color: 'white' }}>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>
            </>
          )}

          {forgotStep === 'requestOtp' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <p className="text-sm text-gray-600">Enter the email address for your account.</p>
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-gray-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={forgotEmail || email}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10 bg-white border-gray-200"
                    style={{ focusBorderColor: '#03A9F4', focusRingColor: '#03A9F4' }}
                  />
                </div>
              </div>
              {forgotError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {forgotError}
                </div>
              )}
              <Button
                type="submit"
                disabled={forgotLoading}
                className="w-full shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:scale-[1.02] font-medium"
                style={tealButtonStyle}
              >
                {forgotLoading ? (
                  <div className="flex items-center gap-2" style={{ color: 'white' }}>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <span style={{ color: 'white' }}>Send OTP</span>
                )}
              </Button>
              <Button
                type="button"
                onClick={goBackToLogin}
                className="w-full flex items-center justify-center gap-2 shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl font-medium"
                style={tealButtonStyle}
              >
                <ArrowLeft className="h-4 w-4" />
                <span style={{ color: 'white' }}>Back to login</span>
              </Button>
            </form>
          )}

          {forgotStep === 'resetPassword' && !otpVerified && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <p className="text-sm text-gray-600">
                Enter the OTP sent to <strong>{forgotEmail}</strong>.
              </p>
              {devOtp && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                  For testing, your OTP is: <strong>{devOtp}</strong>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700 font-medium">OTP</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="pl-10 bg-white border-gray-200"
                    style={{ focusBorderColor: '#03A9F4', focusRingColor: '#03A9F4' }}
                  />
                </div>
              </div>
              {forgotError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {forgotError}
                </div>
              )}
              <Button
                type="submit"
                disabled={forgotLoading}
                className="w-full shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:scale-[1.02] font-medium"
                style={tealButtonStyle}
              >
                {forgotLoading ? (
                  <div className="flex items-center gap-2" style={{ color: 'white' }}>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  <span style={{ color: 'white' }}>Verify OTP</span>
                )}
              </Button>
              <Button
                type="button"
                onClick={goBackToLogin}
                className="w-full flex items-center justify-center gap-2 shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl font-medium"
                style={tealButtonStyle}
              >
                <ArrowLeft className="h-4 w-4" />
                <span style={{ color: 'white' }}>Back to login</span>
              </Button>
            </form>
          )}

          {forgotStep === 'resetPassword' && otpVerified && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <p className="text-sm text-gray-600">Set your new password.</p>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-700 font-medium">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-14 bg-white border-gray-200"
                    style={{ focusBorderColor: '#03A9F4', focusRingColor: '#03A9F4' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-transparent! text-black! hover:text-gray-600! transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-700 font-medium">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-white border-gray-200"
                    style={{ focusBorderColor: '#03A9F4', focusRingColor: '#03A9F4' }}
                  />
                </div>
              </div>
              {forgotError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {forgotError}
                </div>
              )}
              <Button
                type="submit"
                disabled={forgotLoading}
                className="w-full shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:scale-[1.02] font-medium"
                style={tealButtonStyle}
              >
                {forgotLoading ? (
                  <div className="flex items-center gap-2" style={{ color: 'white' }}>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </div>
                ) : (
                  <span style={{ color: 'white' }}>Reset password</span>
                )}
              </Button>
              <Button
                type="button"
                onClick={goBackToLogin}
                className="w-full flex items-center justify-center gap-2 shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl font-medium"
                style={tealButtonStyle}
              >
                <ArrowLeft className="h-4 w-4" />
                <span style={{ color: 'white' }}>Back to login</span>
              </Button>
            </form>
          )}

          {forgotStep === 'success' && (
            <div className="space-y-6">
              <p className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                Password reset successfully. You can now sign in.
              </p>
              <Button
                type="button"
                onClick={goBackToLogin}
                className="w-full shadow-lg transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:scale-[1.02] font-medium flex items-center justify-center gap-2"
                style={tealButtonStyle}
              >
                <ArrowLeft className="h-4 w-4" />
                <span style={{ color: 'white' }}>Back to login</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
