'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="glass-panel" style={{
        margin: '20px auto',
        width: 'calc(100% - 40px)',
        maxWidth: '1200px',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        borderRadius: 'var(--border-radius-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Logo Icon */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="10" height="10" rx="2" stroke="url(#logoGrad)" strokeWidth="3" />
            <rect x="2" y="20" width="10" height="10" rx="2" stroke="url(#logoGrad)" strokeWidth="3" />
            <rect x="20" y="2" width="10" height="10" rx="2" stroke="url(#logoGrad)" strokeWidth="3" />
            <rect x="20" y="20" width="10" height="10" rx="2" fill="url(#logoGrad)" />
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--accent-primary)" />
                <stop offset="1" stopColor="var(--accent-secondary)" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            QR<span style={{ color: 'var(--accent-secondary)' }}>Flow</span>
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#features" className="nav-link" style={{ fontWeight: 600 }}>Features</a>
          {user ? (
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              Dashboard
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/login" className="nav-link" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Sign In
              </Link>
              <Link href="/signup" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' }}>
        <section style={{
          textAlign: 'center',
          maxWidth: '800px',
          marginBottom: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }} className="animate-fade-in">
          <span className="badge badge-active" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            Next-Gen QR Solutions
          </span>

          <h1 style={{
            fontSize: 'clamp(2.25rem, 5vw, 4rem)',
            fontWeight: 850,
            lineHeight: 1.15,
            letterSpacing: '-0.04em',
            background: 'linear-gradient(to right, #ffffff, var(--text-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Dynamic QR Codes with <span style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Real-time Analytics</span>
          </h1>

          <p style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.2rem)', maxWidth: '600px', margin: '0 auto', paddingLeft: '12px', paddingRight: '12px' }}>
            Create custom-styled QR codes. Update their destinations at any time without changing the QR image, and track detailed scan statistics.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/signup" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                  Create Free Account
                </Link>
                <Link href="/login" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                  Live Demo
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features Visual Grid */}
        <section id="features" style={{
          maxWidth: '1200px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '20px'
        }}>
          {/* Card 1 */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(124, 77, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)'
            }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 3h2v2h-2zm4 0h2v2h-2zm0-4h2v2h-2zm-4 0h2v2h-2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Dynamic Destinations</h3>
            <p>Change where your QR code links to at any point, even after it is printed. Update target URLs, phone numbers, or Wi-Fi credentials instantly.</p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 64, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-secondary)'
            }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                <path d="M12 8V12L14 14" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Full QR Customization</h3>
            <p>Personalize your QR codes with custom colors, dot types, eye corner geometries, error correction settings, and upload your custom business logo.</p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(0, 230, 118, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-success)'
            }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 20V10M12 20V4M6 20v-6" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem' }}>Real-time Analytics</h3>
            <p>Access precise click tracking. View total scans, browser usage, device splits, operating systems, country demographics, and referrer channels.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '32px 20px',
        textAlign: 'center',
        fontSize: '0.9rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            &copy; {new Date().getFullYear()} QRFlow Inc. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" className="nav-link">Privacy Policy</a>
            <a href="#" className="nav-link">Terms of Service</a>
            <a href="#" className="nav-link">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
