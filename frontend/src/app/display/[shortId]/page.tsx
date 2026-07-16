'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/utils/api';
import { useToast } from '@/context/ToastContext';
import { useParams } from 'next/navigation';

export default function DisplayContentPage() {
  const params = useParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<any>(null);

  useEffect(() => {
    const fetchPublicQr = async () => {
      try {
        const data = await apiRequest(`/api/qr/${params.shortId}`);
        if (data.type === 'url') {
          let targetUrl = typeof data.destination_content === 'object' ? data.destination_content.url : data.destination_content;
          if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'http://' + targetUrl;
          }
          window.location.href = targetUrl;
          return;
        }
        setQr(data);
      } catch (err: any) {
        showToast(err.message || 'Error resolving QR code content.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicQr();
  }, [params.shortId, showToast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  // Generate and Download vCard contact file dynamically
  const downloadVCard = () => {
    if (!qr || qr.type !== 'vcard') return;
    const content = qr.destination_content || {};
    
    const vcardText = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${content.lastName || ''};${content.firstName || ''};;;`,
      `FN:${content.firstName || ''} ${content.lastName || ''}`,
      content.org ? `ORG:${content.org}` : '',
      content.phone ? `TEL;TYPE=CELL:${content.phone}` : '',
      content.email ? `EMAIL;TYPE=PREF,INTERNET:${content.email}` : '',
      content.website ? `URL:${content.website}` : '',
      content.note ? `NOTE:${content.note}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${content.firstName || 'contact'}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Contact card downloaded successfully.', 'success');
  };

  // Generate and Download iCalendar (.ics) event file dynamically
  const downloadICS = () => {
    if (!qr || qr.type !== 'event') return;
    const content = qr.destination_content || {};

    const formatICSDate = (dateStr: string) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatICSDate(content.start);
    const end = formatICSDate(content.end);

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//dynamicQR//Dynamic Event//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${content.title || 'Event'}`,
      start ? `DTSTART:${start}` : '',
      end ? `DTEND:${end}` : '',
      content.location ? `LOCATION:${content.location}` : '',
      content.description ? `DESCRIPTION:${content.description}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${content.title || 'event'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Event calendar file downloaded.', 'success');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center' }}>
        <div className="shimmer-loading" style={{ width: '240px', height: '50px' }}>Loading QR Details...</div>
      </div>
    );
  }

  if (!qr) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <svg width="48" height="48" fill="none" stroke="var(--accent-error)" strokeWidth="2" viewBox="0 0 24 24" style={{ marginBottom: '16px' }}>
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3>QR Code Resolution Error</h3>
          <p style={{ marginTop: '8px' }}>This QR code has been disabled, suspended, or does not exist.</p>
        </div>
      </div>
    );
  }

  const content = qr.destination_content || {};

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Branding header */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="10" height="10" rx="2" stroke="url(#displayLogo)" strokeWidth="3" />
            <rect x="2" y="20" width="10" height="10" rx="2" stroke="url(#displayLogo)" strokeWidth="3" />
            <rect x="20" y="2" width="10" height="10" rx="2" stroke="url(#displayLogo)" strokeWidth="3" />
            <rect x="20" y="20" width="10" height="10" rx="2" fill="url(#displayLogo)" />
            <defs>
              <linearGradient id="displayLogo" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--accent-primary)" />
                <stop offset="1" stopColor="var(--accent-secondary)" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            dynamic<span style={{ color: 'var(--accent-secondary)' }}>QR</span>
          </span>
        </div>

        {/* Dynamic content card based on type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Plain Text */}
          {qr.type === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span className="badge badge-active" style={{ width: 'fit-content' }}>Plain Text</span>
              <p style={{
                background: 'rgba(0,0,0,0.2)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--glass-border)',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--text-primary)'
              }}>{content.text || content}</p>
              <button className="btn btn-primary" onClick={() => copyToClipboard(content.text || content)}>
                Copy Text Content
              </button>
            </div>
          )}

          {/* Phone */}
          {qr.type === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <span className="badge badge-active" style={{ width: 'fit-content', margin: '0 auto' }}>Phone Number</span>
              <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-mono)' }}>{content.phone}</h2>
              <a href={`tel:${content.phone}`} className="btn btn-primary" style={{ marginTop: '8px' }}>
                Place Phone Call
              </a>
            </div>
          )}

          {/* SMS */}
          {qr.type === 'sms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span className="badge badge-active" style={{ width: 'fit-content' }}>SMS Text Message</span>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Send to:</span>
                <p style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', fontWeight: 650 }}>{content.phone}</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Message Payload:</span>
                <p style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>{content.message}</p>
              </div>
              <a href={`sms:${content.phone}?body=${encodeURIComponent(content.message)}`} className="btn btn-primary">
                Send SMS Now
              </a>
            </div>
          )}

          {/* Email */}
          {qr.type === 'email' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span className="badge badge-active" style={{ width: 'fit-content' }}>Email Details</span>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Recipient:</span>
                <p style={{ fontWeight: 650 }}>{content.email}</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Subject:</span>
                <p style={{ fontWeight: 650 }}>{content.subject}</p>
              </div>
              {content.body && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Message Body:</span>
                  <p style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>{content.body}</p>
                </div>
              )}
              <a href={`mailto:${content.email}?subject=${encodeURIComponent(content.subject)}&body=${encodeURIComponent(content.body || '')}`} className="btn btn-primary">
                Draft Email Message
              </a>
            </div>
          )}

          {/* WhatsApp */}
          {qr.type === 'whatsapp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span className="badge badge-active" style={{ width: 'fit-content' }}>WhatsApp Chat</span>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Phone Number:</span>
                <p style={{ fontWeight: 650, fontFamily: 'var(--font-mono)' }}>+{content.phone}</p>
              </div>
              {content.message && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Prefilled Message:</span>
                  <p style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>{content.message}</p>
                </div>
              )}
              <a href={`https://wa.me/${content.phone}?text=${encodeURIComponent(content.message || '')}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Start WhatsApp Chat
              </a>
            </div>
          )}

          {/* Wi-Fi */}
          {qr.type === 'wifi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span className="badge badge-active" style={{ width: 'fit-content' }}>Wi-Fi Access Portal</span>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>SSID Network Name:</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 750 }}>{content.ssid}</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Security Protocol:</span>
                <p style={{ textTransform: 'uppercase' }}>{content.encryption}</p>
              </div>
              {content.password && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Password:</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="password"
                      className="form-input"
                      style={{ fontFamily: 'var(--font-mono)', border: '1px dashed var(--glass-border)' }}
                      value={content.password}
                      readOnly
                    />
                    <button className="btn btn-secondary" style={{ padding: '0 16px' }} onClick={() => copyToClipboard(content.password)}>
                      Copy
                    </button>
                  </div>
                </div>
              )}
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '10px' }}>
                Open Wi-Fi settings on your device, select <strong>{content.ssid}</strong>, and enter the password to connect.
              </p>
            </div>
          )}

          {/* vCard Contact Card */}
          {qr.type === 'vcard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span className="badge badge-active" style={{ width: 'fit-content' }}>vCard Business Card</span>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {content.firstName?.[0]?.toUpperCase() || 'C'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem' }}>{`${content.firstName || ''} ${content.lastName || ''}`}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{content.org}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                {content.phone && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Mobile Phone</span>
                    <a href={`tel:${content.phone}`} style={{ color: 'var(--accent-primary)', fontWeight: 650 }}>{content.phone}</a>
                  </div>
                )}
                {content.email && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Email Address</span>
                    <a href={`mailto:${content.email}`} style={{ color: 'var(--accent-primary)', fontWeight: 650 }}>{content.email}</a>
                  </div>
                )}
                {content.website && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Website Portfolio</span>
                    <a href={content.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-secondary)' }}>{content.website}</a>
                  </div>
                )}
              </div>

              <button onClick={downloadVCard} className="btn btn-primary" style={{ marginTop: '8px' }}>
                Save Contact Card
              </button>
            </div>
          )}

          {/* Location */}
          {qr.type === 'location' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span className="badge badge-active" style={{ width: 'fit-content' }}>Google Maps Location</span>
              {content.address && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Location Target:</span>
                  <p style={{ fontWeight: 650 }}>{content.address}</p>
                </div>
              )}
              {content.latitude && content.longitude && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Coordinates:</span>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{`${content.latitude}, ${content.longitude}`}</p>
                </div>
              )}
              
              <a
                href={
                  content.latitude && content.longitude
                    ? `https://www.google.com/maps/search/?api=1&query=${content.latitude},${content.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.address || '')}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
              >
                Open in Google Maps
              </a>
            </div>
          )}

          {/* Event */}
          {qr.type === 'event' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span className="badge badge-active" style={{ width: 'fit-content' }}>Calendar Event Details</span>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Event Title:</span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '2px' }}>{content.title}</h3>
              </div>
              <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Start Time</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{content.start ? new Date(content.start).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>End Time</span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{content.end ? new Date(content.end).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              {content.location && (
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Location / Venue:</span>
                  <p style={{ fontSize: '0.9rem' }}>{content.location}</p>
                </div>
              )}
              
              <button onClick={downloadICS} className="btn btn-primary" style={{ marginTop: '8px' }}>
                Add to Calendar (.ics)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
