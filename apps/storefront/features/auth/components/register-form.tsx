'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { authService } from '../services/auth.service';
import { authValidation, RegisterFormData } from '@nfi/shared';
import { useAuthStore } from '../store/auth.store';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@nfi/ui';
import { Eye, EyeOff, Check, X } from 'lucide-react';

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const setToken = useAuthStore(state => state.setToken);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(authValidation.registerSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' });

  const passwordRules = [
    { label: 'At least 10 characters', test: (v: string) => v.length >= 10 },
    { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
    { label: 'One lowercase letter', test: (v: string) => /[a-z]/.test(v) },
    { label: 'One number', test: (v: string) => /\d/.test(v) },
    { label: 'One special character', test: (v: string) => /[^a-zA-Z0-9\s]/.test(v) },
  ];

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setLoading(true);
    try {
      const cleanData: RegisterFormData = {
        ...data,
        phone: data.phone ? data.phone.replace(/[\s\-()]/g, '') : '',
      };
      const response = await authService.register(cleanData);
      if (response.success && response.data) {
        if (response.data.accessToken) {
          setToken(response.data.accessToken);
          router.push('/');
        } else {
          // Seamless auto-login if backend returns 201 without accessToken
          try {
            const loginRes = await authService.login({
              email: cleanData.email,
              password: cleanData.password,
            });
            if (loginRes.success && loginRes.data?.accessToken) {
              setToken(loginRes.data.accessToken);
              router.push('/');
              return;
            }
          } catch {
            // fallback to login page
          }
          router.push('/login?registered=true');
        }
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {error && <div className="text-destructive text-sm font-medium">{error}</div>}
          
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jane Doe"
              disabled={loading}
              {...register('fullName')}
            />
            {errors.fullName && <p className="text-destructive text-xs">{errors.fullName.message}</p>}
          </div>

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
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1234567890"
              disabled={loading}
              {...register('phone')}
            />
            {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                disabled={loading}
                {...register('password')}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {passwordValue && (
              <div className="grid gap-1 mt-2 mb-2 p-2 bg-muted rounded-md text-xs">
                {passwordRules.map((rule, idx) => {
                  const passed = rule.test(passwordValue);
                  return (
                    <div key={idx} className={`flex items-center gap-2 ${passed ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-50" />}
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                disabled={loading}
                {...register('confirmPassword')}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>}
          </div>

          <Button disabled={loading} type="submit">
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </div>
      </form>
    </div>
  );
}
