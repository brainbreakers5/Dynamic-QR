'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Protect route
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Close sidebar on page change (for mobile viewports)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('qr_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('qr_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center' }}>
        <div className="shimmer-loading" style={{ width: '200px', height: '40px' }}>Loading workspace...</div>
      </div>
    );
  }

  const isLinkActive = (path: string) => pathname === path;

  return (
    <div className="dashboard-wrapper">
      {/* Mobile Top Navbar Header */}
      <header className="dashboard-mobile-header">
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="10" height="10" rx="2" stroke="url(#mobileLogoGrad)" strokeWidth="3" />
            <rect x="2" y="20" width="10" height="10" rx="2" stroke="url(#mobileLogoGrad)" strokeWidth="3" />
            <rect x="20" y="2" width="10" height="10" rx="2" stroke="url(#mobileLogoGrad)" strokeWidth="3" />
            <rect x="20" y="20" width="10" height="10" rx="2" fill="url(#mobileLogoGrad)" />
            <defs>
              <linearGradient id="mobileLogoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--accent-primary)" />
                <stop offset="1" stopColor="var(--accent-secondary)" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            QR<span style={{ color: 'var(--accent-secondary)' }}>Flow</span>
          </span>
        </Link>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="btn btn-secondary"
          style={{ padding: '8px 12px', border: '1px solid var(--glass-border)' }}
          aria-label="Toggle Navigation Drawer"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div className="dashboard-sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`glass-panel dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Branding */}
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="10" height="10" rx="2" stroke="url(#dashLogo)" strokeWidth="3" />
            <rect x="2" y="20" width="10" height="10" rx="2" stroke="url(#dashLogo)" strokeWidth="3" />
            <rect x="20" y="2" width="10" height="10" rx="2" stroke="url(#dashLogo)" strokeWidth="3" />
            <rect x="20" y="20" width="10" height="10" rx="2" fill="url(#dashLogo)" />
            <defs>
              <linearGradient id="dashLogo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--accent-primary)" />
                <stop offset="1" stopColor="var(--accent-secondary)" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            QR<span style={{ color: 'var(--accent-secondary)' }}>Flow</span>
          </span>
        </Link>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <Link
            href="/dashboard"
            className={`btn ${isLinkActive('/dashboard') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            My QR Codes
          </Link>

          <Link
            href="/dashboard/new"
            className={`btn ${isLinkActive('/dashboard/new') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Create QR Code
          </Link>

          {user.role === 'admin' && (
            <Link
              href="/dashboard/admin"
              className={`btn ${isLinkActive('/dashboard/admin') ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Footer Account Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          {/* User profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 650, fontSize: '0.95rem' }}>{user.name}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{user.email}</span>
            {user.role === 'admin' && <span className="badge badge-active" style={{ width: 'fit-content', marginTop: '6px', fontSize: '0.65rem' }}>Admin</span>}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              title="Toggle Theme"
              style={{ padding: '10px', flex: 1 }}
            >
              {theme === 'dark' ? (
                // Sun Icon
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 17a5 5 0 100-10 5 5 0 000 10z" />
                </svg>
              ) : (
                // Moon Icon
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="btn btn-secondary"
              title="Sign Out"
              style={{ padding: '10px', flex: 1, borderColor: 'rgba(255,23,68,0.2)' }}
            >
              <svg width="18" height="18" fill="none" stroke="var(--accent-error)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
