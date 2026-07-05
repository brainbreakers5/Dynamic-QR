'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address first.', 'info');
      return;
    }
    showToast(`Password reset link sent to ${email} (mocked)`, 'success');
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
              <a href="#" onClick={handleForgotPassword} style={{ color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
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
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
