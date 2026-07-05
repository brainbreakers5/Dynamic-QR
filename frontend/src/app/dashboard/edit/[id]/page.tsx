'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest, API_URL } from '@/utils/api';
import { useToast } from '@/context/ToastContext';
import { useRouter, useParams } from 'next/navigation';
import QRCodeRenderer from '@/components/QRCodeRenderer';

export default function EditQrPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [folder, setFolder] = useState('General');
  const [shortId, setShortId] = useState('');
  const [type, setType] = useState('url');

  // Destination Content Forms
  const [urlData, setUrlData] = useState({ url: '' });
  const [textData, setTextData] = useState({ text: '' });
  const [phoneData, setPhoneData] = useState({ phone: '' });
  const [smsData, setSmsData] = useState({ phone: '', message: '' });
  const [emailData, setEmailData] = useState({ email: '', subject: '', body: '' });
  const [whatsappData, setWhatsappData] = useState({ phone: '', message: '' });
  const [wifiData, setWifiData] = useState({ ssid: '', password: '', encryption: 'WPA' });
  const [vcardData, setVcardData] = useState({ firstName: '', lastName: '', phone: '', email: '', org: '', website: '', note: '' });
  const [locationData, setLocationData] = useState({ latitude: '', longitude: '', address: '' });
  const [eventData, setEventData] = useState({ title: '', start: '', end: '', location: '', description: '' });

  // Customization Settings
  const [dotsColor, setDotsColor] = useState('#7c4dff');
  const [dotsType, setDotsType] = useState<'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded'>('rounded');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [cornersSquareColor, setCornersSquareColor] = useState('#0a0812');
  const [cornersSquareType, setCornersSquareType] = useState<'square' | 'dot' | 'extra-rounded' | 'outround'>('extra-rounded');
  const [cornersDotColor, setCornersDotColor] = useState('#ff4081');
  const [cornersDotType, setCornersDotType] = useState<'square' | 'dot'>('dot');
  
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(0.3);
  const [hideLogoDots, setHideLogoDots] = useState(true);
  const [errorCorrection, setErrorCorrection] = useState('Q');

  useEffect(() => {
    const fetchQrDetails = async () => {
      try {
        const qr = await apiRequest(`/qr/${params.id}`);
        setShortId(qr.short_id);
        setType(qr.type);
        setFolder(qr.folder || 'General');

        // Map destination content
        if (qr.type === 'url') setUrlData(qr.destination_content);
        else if (qr.type === 'text') setTextData(qr.destination_content);
        else if (qr.type === 'phone') setPhoneData(qr.destination_content);
        else if (qr.type === 'sms') setSmsData(qr.destination_content);
        else if (qr.type === 'email') setEmailData(qr.destination_content);
        else if (qr.type === 'whatsapp') setWhatsappData(qr.destination_content);
        else if (qr.type === 'wifi') setWifiData(qr.destination_content);
        else if (qr.type === 'vcard') setVcardData(qr.destination_content);
        else if (qr.type === 'location') setLocationData(qr.destination_content);
        else if (qr.type === 'event') setEventData(qr.destination_content);

        // Map customization settings
        const settings = qr.customization_settings || {};
        if (settings.dotsOptions) {
          setDotsColor(settings.dotsOptions.color || '#7c4dff');
          setDotsType(settings.dotsOptions.type || 'rounded');
        }
        if (settings.backgroundOptions) {
          setBgColor(settings.backgroundOptions.color || '#ffffff');
        }
        if (settings.cornersSquareOptions) {
          setCornersSquareColor(settings.cornersSquareOptions.color || '#0a0812');
          setCornersSquareType(settings.cornersSquareOptions.type || 'extra-rounded');
        }
        if (settings.cornersDotOptions) {
          setCornersDotColor(settings.cornersDotOptions.color || '#ff4081');
          setCornersDotType(settings.cornersDotOptions.type || 'dot');
        }
        if (settings.imageOptions) {
          setHideLogoDots(settings.imageOptions.hideBackgroundDots !== false);
          setLogoSize(settings.imageOptions.imageSize || 0.3);
        }
        setLogo(settings.logo || null);
        setErrorCorrection(settings.errorCorrectionLevel || 'Q');
      } catch (err: any) {
        showToast(err.message || 'Error fetching QR details.', 'error');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchQrDetails();
  }, [params.id, router, showToast]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo file size must be under 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogo(event.target?.result as string);
      showToast('New logo loaded successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const getDestinationContent = () => {
    switch (type) {
      case 'url': return urlData;
      case 'text': return textData;
      case 'phone': return phoneData;
      case 'sms': return smsData;
      case 'email': return emailData;
      case 'whatsapp': return whatsappData;
      case 'wifi': return wifiData;
      case 'vcard': return vcardData;
      case 'location': return locationData;
      case 'event': return eventData;
      default: return {};
    }
  };

  const validateInputs = () => {
    if (type === 'url' && !urlData.url) {
      showToast('URL is required.', 'error');
      return false;
    }
    if (type === 'text' && !textData.text) {
      showToast('Text content is required.', 'error');
      return false;
    }
    if (type === 'phone' && !phoneData.phone) {
      showToast('Phone number is required.', 'error');
      return false;
    }
    if (type === 'sms' && (!smsData.phone || !smsData.message)) {
      showToast('Phone and message are required.', 'error');
      return false;
    }
    if (type === 'email' && (!emailData.email || !emailData.subject)) {
      showToast('Email and subject are required.', 'error');
      return false;
    }
    if (type === 'wifi' && !wifiData.ssid) {
      showToast('Wi-Fi SSID network name is required.', 'error');
      return false;
    }
    return true;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInputs()) return;

    setSaving(true);
    try {
      const customization_settings = {
        dotsOptions: { color: dotsColor, type: dotsType },
        backgroundOptions: { color: bgColor },
        cornersSquareOptions: { color: cornersSquareColor, type: cornersSquareType },
        cornersDotOptions: { color: cornersDotColor, type: cornersDotType },
        imageOptions: { hideBackgroundDots: hideLogoDots, imageSize: logoSize, margin: 4 },
        logo,
        errorCorrectionLevel: errorCorrection
      };

      await apiRequest(`/qr/${params.id}`, 'PUT', {
        type,
        destination_content: getDestinationContent(),
        customization_settings,
        folder
      });

      showToast('Dynamic QR Code updated successfully!', 'success');
      router.push('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Failed to update QR code.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const previewSettings = {
    dotsOptions: { color: dotsColor, type: dotsType },
    backgroundOptions: { color: bgColor },
    cornersSquareOptions: { color: cornersSquareColor, type: cornersSquareType },
    cornersDotOptions: { color: cornersDotColor, type: cornersDotType },
    imageOptions: { hideBackgroundDots: hideLogoDots, imageSize: logoSize, margin: 4 },
    logo,
    errorCorrectionLevel: errorCorrection
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <div className="shimmer-loading" style={{ width: '200px', height: '40px' }}>Loading QR Details...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '4px' }}>Edit QR Destination</h1>
          <p>Update where this QR Code redirects or tweak its styling. The QR image remains unchanged.</p>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
          Cancel
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* Update Form */}
        <form onSubmit={handleUpdate} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Content Type Selector */}
          <div className="form-group">
            <label className="form-label">QR Type / Content Category</label>
            <select
              className="form-input form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ textTransform: 'capitalize' }}
            >
              <option value="url">Website URL 🔗</option>
              <option value="text">Plain Text 📝</option>
              <option value="phone">Phone Number 📞</option>
              <option value="sms">SMS 💬</option>
              <option value="email">Email Address ✉️</option>
              <option value="whatsapp">WhatsApp Text 💬</option>
              <option value="wifi">Wi-Fi Credentials 📶</option>
              <option value="vcard">vCard Business Contact 📇</option>
              <option value="location">Google Maps Location 📍</option>
              <option value="event">Calendar Event 📅</option>
            </select>
          </div>

          {/* Folder */}
          <div className="form-group">
            <label className="form-label">Folder / Category Organization</label>
            <input
              type="text"
              className="form-input"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
          </div>

          {/* Type-Specific Inputs */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px' }}>Destination Details</h3>

            {/* URL */}
            {type === 'url' && (
              <div className="form-group">
                <label className="form-label">Destination URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/target-page"
                  className="form-input"
                  value={urlData.url}
                  onChange={(e) => setUrlData({ url: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Text */}
            {type === 'text' && (
              <div className="form-group">
                <label className="form-label">Plain Text Content</label>
                <textarea
                  placeholder="Enter text payload..."
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  value={textData.text}
                  onChange={(e) => setTextData({ text: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Phone */}
            {type === 'phone' && (
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="form-input"
                  value={phoneData.phone}
                  onChange={(e) => setPhoneData({ phone: e.target.value })}
                  required
                />
              </div>
            )}

            {/* SMS */}
            {type === 'sms' && (
              <>
                <div className="form-group">
                  <label className="form-label">Target Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="form-input"
                    value={smsData.phone}
                    onChange={(e) => setSmsData({ ...smsData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Message Template</label>
                  <textarea
                    placeholder="Enter default SMS message text..."
                    className="form-input"
                    value={smsData.message}
                    onChange={(e) => setSmsData({ ...smsData, message: e.target.value })}
                    required
                  />
                </div>
              </>
            )}

            {/* Email */}
            {type === 'email' && (
              <>
                <div className="form-group">
                  <label className="form-label">Recipient Email</label>
                  <input
                    type="email"
                    placeholder="contact@business.com"
                    className="form-input"
                    value={emailData.email}
                    onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject Line</label>
                  <input
                    type="text"
                    placeholder="Inquiry from QR Code"
                    className="form-input"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Message Body</label>
                  <textarea
                    placeholder="Enter prefilled message..."
                    className="form-input"
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* WhatsApp */}
            {type === 'whatsapp' && (
              <>
                <div className="form-group">
                  <label className="form-label">WhatsApp Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={whatsappData.phone}
                    onChange={(e) => setWhatsappData({ ...whatsappData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prefilled Message</label>
                  <textarea
                    className="form-input"
                    value={whatsappData.message}
                    onChange={(e) => setWhatsappData({ ...whatsappData, message: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Wi-Fi */}
            {type === 'wifi' && (
              <>
                <div className="form-group">
                  <label className="form-label">SSID (Network Name)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={wifiData.ssid}
                    onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Network Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={wifiData.password}
                    onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Encryption Type</label>
                  <select
                    className="form-input"
                    value={wifiData.encryption}
                    onChange={(e) => setWifiData({ ...wifiData, encryption: e.target.value })}
                  >
                    <option value="WPA">WPA / WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None</option>
                  </select>
                </div>
              </>
            )}

            {/* vCard */}
            {type === 'vcard' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vcardData.firstName}
                    onChange={(e) => setVcardData({ ...vcardData, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vcardData.lastName}
                    onChange={(e) => setVcardData({ ...vcardData, lastName: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={vcardData.phone}
                    onChange={(e) => setVcardData({ ...vcardData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={vcardData.email}
                    onChange={(e) => setVcardData({ ...vcardData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Organization / Company</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vcardData.org}
                    onChange={(e) => setVcardData({ ...vcardData, org: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    className="form-input"
                    value={vcardData.website}
                    onChange={(e) => setVcardData({ ...vcardData, website: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Location */}
            {type === 'location' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Latitude</label>
                    <input
                      type="text"
                      className="form-input"
                      value={locationData.latitude}
                      onChange={(e) => setLocationData({ ...locationData, latitude: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude</label>
                    <input
                      type="text"
                      className="form-input"
                      value={locationData.longitude}
                      onChange={(e) => setLocationData({ ...locationData, longitude: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address Search Address</label>
                  <input
                    type="text"
                    className="form-input"
                    value={locationData.address}
                    onChange={(e) => setLocationData({ ...locationData, address: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Event */}
            {type === 'event' && (
              <>
                <div className="form-group">
                  <label className="form-label">Event Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={eventData.title}
                    onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={eventData.start}
                      onChange={(e) => setEventData({ ...eventData, start: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={eventData.end}
                      onChange={(e) => setEventData({ ...eventData, end: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Event Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={eventData.location}
                    onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          {/* Customization Settings */}
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.15rem' }}>Design & Styling Customization</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Dot Grid Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    className="form-input"
                    style={{ width: '48px', height: '40px', padding: '0', cursor: 'pointer' }}
                    value={dotsColor}
                    onChange={(e) => setDotsColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={dotsColor}
                    onChange={(e) => setDotsColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Background Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    className="form-input"
                    style={{ width: '48px', height: '40px', padding: '0', cursor: 'pointer' }}
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Eye Border Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    className="form-input"
                    style={{ width: '48px', height: '40px', padding: '0', cursor: 'pointer' }}
                    value={cornersSquareColor}
                    onChange={(e) => setCornersSquareColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={cornersSquareColor}
                    onChange={(e) => setCornersSquareColor(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Eye Center Ball Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    className="form-input"
                    style={{ width: '48px', height: '40px', padding: '0', cursor: 'pointer' }}
                    value={cornersDotColor}
                    onChange={(e) => setCornersDotColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    value={cornersDotColor}
                    onChange={(e) => setCornersDotColor(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Dot Modules Shape</label>
                <select
                  className="form-input form-select"
                  value={dotsType}
                  onChange={(e: any) => setDotsType(e.target.value)}
                >
                  <option value="square">Square</option>
                  <option value="dots">Circular Dots</option>
                  <option value="rounded">Rounded Dots</option>
                  <option value="extra-rounded">Extra Rounded</option>
                  <option value="classy">Classy Slanted</option>
                  <option value="classy-rounded">Classy Rounded</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Eye Corner Shape</label>
                <select
                  className="form-input form-select"
                  value={cornersSquareType}
                  onChange={(e: any) => setCornersSquareType(e.target.value)}
                >
                  <option value="square">Sharp Square</option>
                  <option value="dot">Circular Dot</option>
                  <option value="extra-rounded">Smooth Rounded</option>
                  <option value="outround">Outer Curve</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Center Logo Overlay (Upload Image)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="form-input"
                style={{ padding: '8px' }}
              />
              {logo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <img src={logo} alt="Logo preview" style={{ width: '40px', height: '40px', borderRadius: '4px', border: '1px solid var(--glass-border)' }} />
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setLogo(null)}>
                    Remove Logo
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Logo Overlay Size ({Math.round(logoSize * 100)}%)</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.45"
                  step="0.05"
                  value={logoSize}
                  onChange={(e) => setLogoSize(parseFloat(e.target.value))}
                  style={{ accentColor: 'var(--accent-primary)', marginTop: '8px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Error Correction Level</label>
                <select
                  className="form-input form-select"
                  value={errorCorrection}
                  onChange={(e) => setErrorCorrection(e.target.value)}
                >
                  <option value="L">L (7% Restoration)</option>
                  <option value="M">M (15% Restoration)</option>
                  <option value="Q">Q (25% Restoration)</option>
                  <option value="H">H (30% Restoration)</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="hideLogoDots"
                checked={hideLogoDots}
                onChange={(e) => setHideLogoDots(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
              />
              <label htmlFor="hideLogoDots" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                Clear background modules behind logo
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '16px' }}
            disabled={saving}
          >
            {saving ? 'Saving changes...' : 'Save QR Destinations'}
          </button>
        </form>

        {/* Dynamic Preview panel */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Dynamic Preview</h3>
            <p style={{ fontSize: '0.85rem' }}>Adjusting variables updates the live styling. The redirect endpoint for this QR stays permanent.</p>
            
            <div style={{
              background: '#ffffff',
              padding: '20px',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '260px',
              minHeight: '260px'
            }}>
              <QRCodeRenderer shortId={shortId || 'live-preview'} settings={previewSettings} width={220} height={220} />
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>Encoded Short URL:</strong><br />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{API_URL}/qr/{shortId}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
