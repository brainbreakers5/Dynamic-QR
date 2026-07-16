'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/utils/api';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot_email' | 'forgot_verify'>('login');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const { login, user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (searchParams.get('expired')) {
      showToast('Your session has expired. Please log in again.', 'error');
    }
  }, [searchParams, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      showToast('Please use a valid Gmail address (@gmail.com).', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await login(email, password);
      showToast('Logged in successfully!', 'success');
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || 'Invalid credentials.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      showToast('Please use a valid Gmail address (@gmail.com).', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await apiRequest('/auth/forgot-password', 'POST', { email });
      showToast('Verification code sent successfully. Check your email.', 'success');
      setMode('forgot_verify');
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || 'Failed to send verification code.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !resetCode || !newPassword) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    if (resetCode.length !== 6) {
      showToast('Verification code must be 6 digits.', 'error');
      return;
    }

    setFormLoading(true);
    try {
      await apiRequest('/auth/reset-password', 'POST', {
        email,
        code: resetCode,
        newPassword
      });
      showToast('Password reset successfully! You can now log in.', 'success');
      setMode('login');
      setPassword('');
      setResetCode('');
      setNewPassword('');
    } catch (err: unknown) {
      const error = err as { message?: string };
      showToast(error.message || 'Failed to reset password.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center' }}>
        <div className="shimmer-loading" style={{ width: '200px', height: '40px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        
        {mode === 'login' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '8px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Welcome Back
              </h2>
              <p>Log in to manage your dynamic QR codes</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div className="form-label">
                  <label htmlFor="password">Password</label>
                  <a href="#" onClick={(e) => { e.preventDefault(); setMode('forgot_email'); }} style={{ color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                    Forgot Password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px', padding: '14px' }}
                disabled={formLoading}
              >
                {formLoading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <p style={{ fontSize: '0.9rem' }}>
                Don&apos;t have an account?{' '}
                <Link href="/signup" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                  Sign Up
                </Link>
              </p>
            </div>
          </>
        )}

        {mode === 'forgot_email' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '8px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Reset Password
              </h2>
              <p>Enter your Gmail address to receive a verification code</p>
            </div>

            <form onSubmit={handleSendCode}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  className="form-input"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px', padding: '14px' }}
                disabled={formLoading}
              >
                {formLoading ? 'Sending code...' : 'Send Verification Code'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }} style={{ color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                Back to Login
              </a>
            </div>
          </>
        )}

        {mode === 'forgot_verify' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '8px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Verify Reset
              </h2>
              <p>Enter the 6-digit code sent to {email}</p>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label" htmlFor="verify-code">Verification Code</label>
                <input
                  id="verify-code"
                  type="text"
                  className="form-input"
                  placeholder="123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px', padding: '14px' }}
                disabled={formLoading}
              >
                {formLoading ? 'Resetting password...' : 'Reset Password'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }} style={{ color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                Back to Login
              </a>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center' }}>
        <div className="shimmer-loading" style={{ width: '200px', height: '40px' }}>Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
