'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest, API_URL } from '@/utils/api';
import { useToast } from '@/context/ToastContext';
import QRCodeRenderer from '@/components/QRCodeRenderer';
import Link from 'next/link';

interface QRCode {
  id: number;
  short_id: string;
  type: string;
  destination_content: any;
  customization_settings: any;
  status: 'active' | 'archived' | 'deleted';
  is_favorite: number;
  folder: string;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const [qrs, setQrs] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'archived' | 'deleted'>('active');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { showToast } = useToast();

  const fetchQrs = async () => {
    setLoading(true);
    try {
      // Fetch user's QR codes (our backend lists everything; we filter on client or let server filter)
      const data = await apiRequest('/qr/list');
      setQrs(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to retrieve QR codes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrs();
  }, []);

  // Soft Delete QR
  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/qr/${id}`, 'DELETE');
      showToast('QR code moved to trash.', 'success');
      fetchQrs();
    } catch (err: any) {
      showToast(err.message || 'Error deleting QR code', 'error');
    }
  };

  // Permanently Delete QR
  const handlePermanentDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this QR code? This will also purge all its scan history and redirection records.')) {
      return;
    }
    try {
      await apiRequest(`/qr/${id}?permanent=true`, 'DELETE');
      showToast('QR code deleted permanently.', 'success');
      fetchQrs();
    } catch (err: any) {
      showToast(err.message || 'Error deleting QR code', 'error');
    }
  };

  // Restore QR
  const handleRestore = async (id: number) => {
    try {
      await apiRequest(`/qr/${id}`, 'PUT', { status: 'active' });
      showToast('QR code restored successfully.', 'success');
      fetchQrs();
    } catch (err: any) {
      showToast(err.message || 'Error restoring QR code', 'error');
    }
  };

  // Duplicate QR
  const handleDuplicate = async (id: number) => {
    try {
      await apiRequest(`/qr/${id}/duplicate`, 'POST');
      showToast('QR code duplicated successfully!', 'success');
      fetchQrs();
    } catch (err: any) {
      showToast(err.message || 'Error duplicating QR code', 'error');
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (qr: QRCode) => {
    const nextFav = qr.is_favorite === 1 ? 0 : 1;
    try {
      await apiRequest(`/qr/${qr.id}`, 'PUT', { is_favorite: nextFav });
      showToast(nextFav ? 'Added to favorites.' : 'Removed from favorites.', 'success');
      fetchQrs();
    } catch (err: any) {
      showToast(err.message || 'Error setting favorite status', 'error');
    }
  };

  // Toggle Archive Status
  const handleToggleArchive = async (qr: QRCode) => {
    const nextStatus = qr.status === 'archived' ? 'active' : 'archived';
    try {
      await apiRequest(`/qr/${qr.id}`, 'PUT', { status: nextStatus });
      showToast(nextStatus === 'archived' ? 'QR code archived.' : 'QR code unarchived.', 'success');
      fetchQrs();
    } catch (err: any) {
      showToast(err.message || 'Error archiving QR code', 'error');
    }
  };

  // Client-side QR downloads (PNG, SVG) using temporary qr-code-styling wrapper
  const handleDownload = async (qr: QRCode, ext: 'png' | 'svg') => {
    try {
      const QRCodeStyling = (await import('qr-code-styling')).default;
      const downloadQr = new QRCodeStyling({
        width: 1000,
        height: 1000,
        data: `${API_URL}/qr/${qr.short_id}`,
        margin: 10,
        dotsOptions: qr.customization_settings?.dotsOptions || { color: '#000000', type: 'square' },
        backgroundOptions: qr.customization_settings?.backgroundOptions || { color: '#ffffff' },
        cornersSquareOptions: qr.customization_settings?.cornersSquareOptions || { color: '#000000', type: 'square' },
        cornersDotOptions: qr.customization_settings?.cornersDotOptions || { color: '#000000', type: 'square' },
        imageOptions: qr.customization_settings?.imageOptions || { hideBackgroundDots: true, imageSize: 0.4, margin: 5 },
        image: qr.customization_settings?.logo || undefined,
      });

      await downloadQr.download({ name: `qr-${qr.short_id}`, extension: ext });
      showToast(`QR Code downloaded as ${ext.toUpperCase()}`, 'success');
    } catch (e) {
      showToast('Error downloading QR code', 'error');
    }
  };

  // Client-side PDF generation
  const handleDownloadPDF = async (qr: QRCode) => {
    try {
      const { jsPDF } = await import('jspdf');
      const QRCodeStyling = (await import('qr-code-styling')).default;
      const downloadQr = new QRCodeStyling({
        width: 1000,
        height: 1000,
        data: `${API_URL}/qr/${qr.short_id}`,
        margin: 10,
        dotsOptions: qr.customization_settings?.dotsOptions || { color: '#000000', type: 'square' },
        backgroundOptions: qr.customization_settings?.backgroundOptions || { color: '#ffffff' },
        cornersSquareOptions: qr.customization_settings?.cornersSquareOptions || { color: '#000000', type: 'square' },
        cornersDotOptions: qr.customization_settings?.cornersDotOptions || { color: '#000000', type: 'square' },
        imageOptions: qr.customization_settings?.imageOptions || { hideBackgroundDots: true, imageSize: 0.4, margin: 5 },
        image: qr.customization_settings?.logo || undefined,
      });

      const div = document.createElement('div');
      await downloadQr.append(div);

      // Wait a moment for canvas assembly
      setTimeout(() => {
        const canvas = div.querySelector('canvas');
        if (canvas) {
          const imgData = canvas.toDataURL('image/png');
          const doc = new jsPDF();
          doc.setFillColor(18, 14, 34); // Dark theme matching background
          doc.rect(0, 0, 210, 297, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(22);
          doc.text('QRFlow PDF Export', 105, 30, { align: 'center' });
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(163, 158, 185);
          doc.text(`Short Redirect URL: ${API_URL}/qr/${qr.short_id}`, 105, 42, { align: 'center' });
          doc.text(`Content Type: ${qr.type.toUpperCase()}`, 105, 50, { align: 'center' });
          doc.text(`Total Scans: ${qr.scan_count}`, 105, 58, { align: 'center' });

          doc.addImage(imgData, 'PNG', 45, 75, 120, 120);

          doc.setFontSize(10);
          doc.text('Scanned dynamic QR codes redirect to the configured destination instantly.', 105, 220, { align: 'center' });
          doc.text(`Generated on ${new Date().toLocaleString()}`, 105, 230, { align: 'center' });
          
          doc.save(`qr-report-${qr.short_id}.pdf`);
          showToast('QR Code report downloaded as PDF', 'success');
        } else {
          showToast('Failed to parse QR vector canvas', 'error');
        }
      }, 400);
    } catch (e) {
      console.error(e);
      showToast('Error exporting PDF', 'error');
    }
  };

  // Dynamic statistics calculations
  const totalQrs = qrs.filter(qr => qr.status !== 'deleted').length;
  const activeQrs = qrs.filter(qr => qr.status === 'active').length;
  const totalScans = qrs.reduce((acc, curr) => acc + curr.scan_count, 0);

  // Folders list extraction
  const folders = Array.from(new Set(qrs.map(qr => qr.folder || 'General')));

  // Filtering
  const filteredQrs = qrs.filter(qr => {
    // Status tab filter
    if (qr.status !== selectedStatus) return false;
    
    // Folder filter
    if (selectedFolder !== 'All' && qr.folder !== selectedFolder) return false;
    
    // Favorite filter
    if (favoritesOnly && qr.is_favorite !== 1) return false;
    
    // Search query matching
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const contentMatch = typeof qr.destination_content === 'string'
        ? qr.destination_content.toLowerCase().includes(q)
        : JSON.stringify(qr.destination_content).toLowerCase().includes(q);
      
      return (
        qr.short_id.toLowerCase().includes(q) ||
        qr.type.toLowerCase().includes(q) ||
        qr.folder.toLowerCase().includes(q) ||
        contentMatch
      );
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '4px' }}>Dashboard</h1>
          <p>Create, manage, and monitor your dynamic QR code performance</p>
        </div>
        <Link href="/dashboard/new" className="btn btn-primary">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" />
          </svg>
          New QR Code
        </Link>
      </div>

      {/* Stats Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px'
      }}>
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Total QR Codes</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{loading ? '...' : totalQrs}</span>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Active QR Codes</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{loading ? '...' : activeQrs}</span>
        </div>

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Total Scan Activity</span>
          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{loading ? '...' : totalScans}</span>
        </div>
      </div>

      {/* Filter and Management Bar */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search by ID, type, content..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Folder Filter */}
          <div style={{ width: '180px' }}>
            <select
              className="form-input form-select"
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
            >
              <option value="All">All Folders</option>
              {folders.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Favorites Filter */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`btn ${favoritesOnly ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '12px 16px' }}
          >
            <svg width="18" height="18" fill={favoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.246.588 1.81l-3.974 2.89a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.88a1 1 0 00-1.176 0l-3.976 2.88c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.05 11.1c-.771-.563-.372-1.81.587-1.81H7.3c.365 0 .685-.246.8-.69l1.52-4.674z" />
            </svg>
            Favorites Only
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
          <button
            onClick={() => setSelectedStatus('active')}
            className={`btn ${selectedStatus === 'active' ? 'btn-secondary' : ''}`}
            style={{ border: selectedStatus === 'active' ? '1px solid var(--accent-primary)' : 'none', background: selectedStatus === 'active' ? 'rgba(124, 77, 255, 0.08)' : 'transparent', color: selectedStatus === 'active' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
          >
            Active QRs ({qrs.filter(q => q.status === 'active').length})
          </button>

          <button
            onClick={() => setSelectedStatus('archived')}
            className={`btn ${selectedStatus === 'archived' ? 'btn-secondary' : ''}`}
            style={{ border: selectedStatus === 'archived' ? '1px solid var(--accent-warning)' : 'none', background: selectedStatus === 'archived' ? 'rgba(255, 214, 0, 0.08)' : 'transparent', color: selectedStatus === 'archived' ? 'var(--accent-warning)' : 'var(--text-secondary)' }}
          >
            Archived QRs ({qrs.filter(q => q.status === 'archived').length})
          </button>

          <button
            onClick={() => setSelectedStatus('deleted')}
            className={`btn ${selectedStatus === 'deleted' ? 'btn-secondary' : ''}`}
            style={{ border: selectedStatus === 'deleted' ? '1px solid var(--accent-error)' : 'none', background: selectedStatus === 'deleted' ? 'rgba(255, 23, 68, 0.08)' : 'transparent', color: selectedStatus === 'deleted' ? 'var(--accent-error)' : 'var(--text-secondary)' }}
          >
            Trash ({qrs.filter(q => q.status === 'deleted').length})
          </button>
        </div>
      </div>

      {/* QR Codes Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-panel shimmer-loading" style={{ height: '300px' }}>Loading...</div>
          ))}
        </div>
      ) : filteredQrs.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <svg width="48" height="48" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: '16px' }}>
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No QR Codes Found</h3>
          <p>No QR codes match your selected filter criteria. Try updating search tags or creating a new QR code.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredQrs.map((qr) => {
            const shortUrl = `${API_URL}/qr/${qr.short_id}`;
            let destPreview = '';
            if (qr.type === 'url') {
              destPreview = qr.destination_content?.url || qr.destination_content;
            } else if (qr.type === 'text') {
              destPreview = qr.destination_content?.text || qr.destination_content;
            } else {
              destPreview = `${qr.type.toUpperCase()} content`;
            }

            return (
              <div key={qr.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
                
                {/* Favorite Toggle Button */}
                {qr.status !== 'deleted' && (
                  <button
                    onClick={() => handleToggleFavorite(qr)}
                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: qr.is_favorite ? 'var(--accent-warning)' : 'var(--text-muted)' }}
                    title={qr.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <svg width="22" height="22" fill={qr.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.246.588 1.81l-3.974 2.89a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.88a1 1 0 00-1.176 0l-3.976 2.88c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.05 11.1c-.771-.563-.372-1.81.587-1.81H7.3c.365 0 .685-.246.8-.69l1.52-4.674z" />
                    </svg>
                  </button>
                )}

                {/* QR Code Canvas Preview */}
                <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QRCodeRenderer shortId={qr.short_id} settings={qr.customization_settings} width={120} height={120} />
                </div>

                {/* Info details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{qr.short_id}</span>
                    <span className="badge badge-active" style={{ fontSize: '0.65rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>{qr.type}</span>
                    <span className="badge badge-active" style={{ fontSize: '0.65rem', background: 'rgba(124, 77, 255, 0.1)', color: 'var(--accent-primary)' }}>{qr.folder}</span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={destPreview}>
                    <strong>Destination:</strong> {destPreview}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                    <span>Scans: <strong>{qr.scan_count}</strong></span>
                    <span>Updated: {new Date(qr.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Operations */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  {qr.status === 'deleted' ? (
                    <>
                      <button onClick={() => handleRestore(qr.id)} className="btn btn-secondary" style={{ flex: 1, padding: '8px' }}>
                        Restore
                      </button>
                      <button onClick={() => handlePermanentDelete(qr.id)} className="btn btn-danger" style={{ flex: 1, padding: '8px' }}>
                        Purge
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href={`/dashboard/edit/${qr.id}`} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}>
                        Edit
                      </Link>
                      <Link href={`/dashboard/analytics/${qr.id}`} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.85rem', borderColor: 'rgba(0, 230, 118, 0.25)' }}>
                        Stats
                      </Link>

                      {/* Download Button Group (Simple dropdown styled as buttons) */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleDownload(qr, 'png')} className="btn btn-secondary" style={{ padding: '8px', fontSize: '0.8rem' }} title="Download PNG">PNG</button>
                        <button onClick={() => handleDownload(qr, 'svg')} className="btn btn-secondary" style={{ padding: '8px', fontSize: '0.8rem' }} title="Download SVG">SVG</button>
                        <button onClick={() => handleDownloadPDF(qr)} className="btn btn-primary" style={{ padding: '8px', fontSize: '0.8rem' }} title="Export PDF Report">PDF</button>
                      </div>
                    </>
                  )}
                </div>

                {/* Context Menu Options for active QRs */}
                {qr.status !== 'deleted' && (
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleDuplicate(qr.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }} className="nav-link">Duplicate</button>
                    <span>•</span>
                    <button onClick={() => handleToggleArchive(qr)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }} className="nav-link">
                      {qr.status === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                    <span>•</span>
                    <button onClick={() => handleDelete(qr.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-error)', fontSize: '0.75rem', cursor: 'pointer' }} className="nav-link">Trash</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
