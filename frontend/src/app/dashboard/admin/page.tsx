'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/utils/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface PlatformUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface PlatformQR {
  id: number;
  short_id: string;
  type: string;
  destination_content: any;
  status: string;
  scan_count: number;
  created_at: string;
  owner_name: string;
  owner_email: string;
}

interface PlatformStats {
  total_users: number;
  total_qr_codes: number;
  total_scans: number;
  qr_by_status: { status: string; count: number }[];
  qr_by_type: { type: string; count: number }[];
}

export default function AdminPanelPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [qrCodes, setQrCodes] = useState<PlatformQR[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'qrs'>('stats');

  useEffect(() => {
    // Safety check
    if (user && user.role !== 'admin') {
      showToast('Access denied. Administrator privileges required.', 'error');
      router.push('/dashboard');
    }
  }, [user, router, showToast]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, qrsData] = await Promise.all([
        apiRequest('/admin/stats'),
        apiRequest('/admin/users'),
        apiRequest('/admin/qr-codes')
      ]);
      setStats(statsData);
      setUsers(usersData);
      setQrCodes(qrsData);
    } catch (err: any) {
      showToast(err.message || 'Error downloading administrator logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to permanently delete this user? All their QR codes and scan logs will be purged.')) {
      return;
    }
    try {
      await apiRequest(`/admin/users/${userId}`, 'DELETE');
      showToast('User and associated records purged.', 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error purging user.', 'error');
    }
  };

  const handleUpdateQRStatus = async (qrId: number, nextStatus: string) => {
    try {
      await apiRequest(`/admin/qr-codes/${qrId}/status`, 'PUT', { status: nextStatus });
      showToast(`QR Code status updated to ${nextStatus}`, 'success');
      loadAdminData();
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <div className="shimmer-loading" style={{ width: '200px', height: '40px' }}>Loading Administration...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      <div>
        <h1 style={{ fontSize: '2.25rem', marginBottom: '4px' }}>Platform Administration</h1>
        <p>Monitor platform statistics, manage active user folders, and audit links.</p>
      </div>

      {/* Tabs */}
      <div className="glass-panel" style={{ display: 'flex', gap: '8px', padding: '12px 16px' }}>
        <button
          onClick={() => setActiveTab('stats')}
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          System Stats
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          Manage Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('qrs')}
          className={`btn ${activeTab === 'qrs' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          Audit QR Codes ({qrCodes.length})
        </button>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px'
          }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Active Users</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.total_users}</span>
            </div>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total QR Codes</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{stats.total_qr_codes}</span>
            </div>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Total Scan Redirections</span>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{stats.total_scans}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Split by Status */}
            <div className="glass-panel" style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>QR Split by Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.qr_by_status.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 650 }}>{item.status}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.count} codes</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Split by Type */}
            <div className="glass-panel" style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>QR Split by Content Type</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.qr_by_type.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 650 }}>{item.type}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.count} codes</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>User Profiles Ledger</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px' }}>User ID</th>
                  <th style={{ padding: '12px 8px' }}>Name</th>
                  <th style={{ padding: '12px 8px' }}>Email Address</th>
                  <th style={{ padding: '12px 8px' }}>Role</th>
                  <th style={{ padding: '12px 8px' }}>Registered Date</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)' }}>{u.id}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 650 }}>{u.name}</td>
                    <td style={{ padding: '12px 8px' }}>{u.email}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge badge-active" style={{ background: u.role === 'admin' ? 'rgba(124,77,255,0.15)' : 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      {u.id !== user?.id ? (
                        <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                          Delete User
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Self (Admin)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Codes Tab */}
      {activeTab === 'qrs' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Platform QR Registry</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px' }}>ID</th>
                  <th style={{ padding: '12px 8px' }}>Short ID</th>
                  <th style={{ padding: '12px 8px' }}>Owner</th>
                  <th style={{ padding: '12px 8px' }}>Type</th>
                  <th style={{ padding: '12px 8px' }}>Destination Preview</th>
                  <th style={{ padding: '12px 8px' }}>Scans</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {qrCodes.map(qr => {
                  let destPreview = '';
                  if (qr.type === 'url') destPreview = qr.destination_content?.url || qr.destination_content;
                  else if (qr.type === 'text') destPreview = qr.destination_content?.text || qr.destination_content;
                  else destPreview = `${qr.type.toUpperCase()} content`;

                  return (
                    <tr key={qr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)' }}>{qr.id}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 650, fontFamily: 'var(--font-mono)' }}>{qr.short_id}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong>{qr.owner_name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{qr.owner_email}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textTransform: 'uppercase', fontSize: '0.75rem' }}>{qr.type}</td>
                      <td style={{ padding: '12px 8px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={destPreview}>
                        {destPreview}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 700 }}>{qr.scan_count}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge badge-${qr.status === 'suspended' ? 'deleted' : qr.status}`}>
                          {qr.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          {qr.status !== 'suspended' ? (
                            <button
                              onClick={() => handleUpdateQRStatus(qr.id, 'suspended')}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--accent-warning)', color: 'var(--accent-warning)' }}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateQRStatus(qr.id, 'active')}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--accent-success)', color: 'var(--accent-success)' }}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateQRStatus(qr.id, 'deleted')}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            Purge
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
