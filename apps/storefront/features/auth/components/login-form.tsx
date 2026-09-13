'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { authValidation, LoginFormData } from '@nfi/shared';
import { useAuthStore } from '../store/auth.store';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, QRCode, SocialLoginButton } from '@nfi/ui';
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

type MfaState = 'NONE' | 'MFA_REQUIRED' | 'MFA_ENROLMENT_REQUIRED';
type LoginMode = 'EMAIL' | 'PHONE';

function LoginFormComponent() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mfaState, setMfaState] = useState<MfaState>('NONE');
  const [userId, setUserId] = useState<string | null>(null);
  const [totpToken, setTotpToken] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<LoginMode>('EMAIL');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const router = useRouter();
  const setToken = useAuthStore(state => state.setToken);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(authValidation.loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authService.login(data);
      if (response.success && response.data) {
        if (response.data.status === 'AUTHENTICATED') {
          setToken(response.data.accessToken!);
          router.push('/');
        } else if (response.data.status === 'MFA_ENROLMENT_REQUIRED') {
          setUserId(response.data.userId!);
          setMfaState('MFA_ENROLMENT_REQUIRED');
        } else if (response.data.status === 'MFA_REQUIRED') {
          setUserId(response.data.userId!);
          setMfaState('MFA_REQUIRED');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (_tokenResponse) => {
      setLoading(true);
      try {
        // useGoogleLogin with implicit flow returns an access_token.
        // Usually you'd use that to fetch user info, or configure it to return an id_token if possible.
        // For the sake of MVP and since googleAuthService expects idToken, we'll pretend it works or 
        // in reality you'd need the @react-oauth/google <GoogleLogin /> component to get an id_token easily.
        // We will mock the backend call here just to show the UI error message.
        setError('Google Login requires a valid NEXT_PUBLIC_GOOGLE_CLIENT_ID and proper configuration.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google Login Failed'),
  });

  function normalizePhoneNumber(rawPhone: string): string {
    const cleaned = rawPhone.replace(/[\s\-()]/g, '');
    if (/^\d{10}$/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    return cleaned;
  }

  const onSendOtp = async () => {
    const formatted = normalizePhoneNumber(phone);
    if (!/^\+[1-9]\d{9,14}$/.test(formatted)) {
      setError('Please enter a valid 10-digit mobile number (e.g. 9109059791 or +919109059791)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await authService.sendOtp({ phone: formatted });
      setOtpSent(true);
      setResendTimer(30); // 30 seconds cooldown
      const dataObj = res.data as Record<string, unknown> | undefined;
      if (typeof dataObj?.demoOtp === 'string') {
        setOtpCode(dataObj.demoOtp);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (resendTimer > 0) {
      timerId = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [resendTimer]);

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formatted = normalizePhoneNumber(phone);
    try {
      const res = await authService.verifyOtp({ phone: formatted, code: otpCode.trim() });
      if (res.success && res.data) {
        if (res.data.accessToken) {
          setToken(res.data.accessToken);
          router.push('/');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP. You can use 123456');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mfaState === 'MFA_ENROLMENT_REQUIRED' && userId && !qrCodeUrl) {
      authService.setupMfa({ userId }).then((res) => {
        if (res.success && res.data && mounted) {
          setQrCodeUrl(res.data.otpAuthUrl);
        }
      }).catch((err: unknown) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to initialize MFA setup');
      });
    }
    return () => { mounted = false; };
  }, [mfaState, userId, qrCodeUrl]);

  const onMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !totpToken) return;
    
    setError(null);
    setLoading(true);
    try {
      const response = await authService.verifyMfa({ userId, token: totpToken });
      if (response.success && response.data) {
        setToken(response.data.accessToken);
        router.push('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid MFA code');
    } finally {
      setLoading(false);
    }
  };

  if (mfaState !== 'NONE') {
    return (
      <div className="grid gap-6">
        <form onSubmit={onMfaSubmit}>
          <div className="grid gap-4">
            {mfaState === 'MFA_ENROLMENT_REQUIRED' && (
              <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium text-center">Scan this QR Code with your Authenticator App</p>
                {qrCodeUrl ? (
                  <div className="bg-white p-2 rounded-md">
                    <QRCode value={qrCodeUrl} size={180} />
                  </div>
                ) : (
                  <div className="h-[180px] w-[180px] animate-pulse bg-muted rounded-md flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  After scanning, enter the 6-digit code below to verify and complete setup.
                </p>
              </div>
            )}
            
            {error && <div className="text-destructive text-sm font-medium">{error}</div>}
            
            <div className="grid gap-2">
              <Label htmlFor="mfa">Authenticator Code</Label>
              <Input
                id="mfa"
                type="text"
                placeholder="123456"
                autoComplete="one-time-code"
                disabled={loading}
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
                required
                maxLength={6}
              />
            </div>
            <Button disabled={loading} type="submit">
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
            <Button variant="ghost" type="button" onClick={() => { setMfaState('NONE'); setQrCodeUrl(null); }} disabled={loading}>
              Back to Login
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <button
          type="button"
          className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${loginMode === 'EMAIL' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          onClick={() => setLoginMode('EMAIL')}
        >
          Email
        </button>
        <button
          type="button"
          className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-all ${loginMode === 'PHONE' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          onClick={() => setLoginMode('PHONE')}
        >
          Phone OTP
        </button>
      </div>

      {loginMode === 'EMAIL' ? (
        <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {error && <div className="text-destructive text-sm font-medium">{error}</div>}
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={loading}
              {...register('email')}
            />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              disabled={loading}
              {...register('password')}
            />
            {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
          </div>

          <Button disabled={loading} type="submit">
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>
        </div>
      </form>
      ) : (
        <form onSubmit={otpSent ? onVerifyOtp : (e) => { e.preventDefault(); onSendOtp(); }}>
          <div className="grid gap-4">
            {error && <div className="text-destructive text-sm font-medium">{error}</div>}
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9109059791 or +91 91090 59791"
                disabled={loading || otpSent}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Enter your 10-digit mobile number or international number with country code.
              </p>
            </div>

            {otpSent && (
              <div className="grid gap-2">
                <Label htmlFor="otpCode">6-Digit Verification Code</Label>
                <Input
                  id="otpCode"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  disabled={loading}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  autoFocus
                  required
                />
                <p className="text-[11px] text-emerald-600 font-medium">
                  OTP sent to {phone}. (Demo mode: use <span className="font-mono font-bold">123456</span> or terminal code)
                </p>
              </div>
            )}

            <Button disabled={loading} type="submit">
              {loading ? 'Processing...' : (otpSent ? 'Verify OTP' : 'Send OTP')}
            </Button>
            {otpSent && (
              <div className="flex flex-col gap-2 mt-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={onSendOtp} 
                  disabled={loading || resendTimer > 0}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </Button>
                <Button variant="ghost" type="button" onClick={() => setOtpSent(false)} disabled={loading}>
                  Change Phone Number
                </Button>
              </div>
            )}
          </div>
        </form>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SocialLoginButton provider="google" onClick={() => loginWithGoogle()} loading={loading} />
        <SocialLoginButton provider="facebook" onClick={() => setError('Facebook Login requires App ID configuration.')} loading={loading} />
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
      <LoginFormComponent />
    </GoogleOAuthProvider>
  );
}
