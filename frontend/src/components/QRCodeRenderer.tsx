'use client';

import React, { useEffect, useRef } from 'react';
import { API_URL } from '@/utils/api';

interface QRCodeRendererProps {
  shortId: string;
  settings?: any;
  width?: number;
  height?: number;
  downloadRef?: React.MutableRefObject<any>; // Can hold styling instance for external trigger
}

export default function QRCodeRenderer({
  shortId,
  settings = {},
  width = 150,
  height = 150,
  downloadRef
}: QRCodeRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrInstance = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const renderQR = async () => {
      const QRCodeStyling = (await import('qr-code-styling')).default;
      const dataUrl = `${API_URL}/qr/${shortId}`;

      const options = {
        width,
        height,
        data: dataUrl,
        margin: 4,
        qrOptions: {
          typeNumber: 0,
          mode: 'Byte',
          errorCorrectionLevel: settings.errorCorrectionLevel || 'Q',
        },
        dotsOptions: settings.dotsOptions || {
          color: '#000000',
          type: 'square',
        },
        backgroundOptions: settings.backgroundOptions || {
          color: '#ffffff',
        },
        cornersSquareOptions: settings.cornersSquareOptions || {
          color: '#000000',
          type: 'square',
        },
        cornersDotOptions: settings.cornersDotOptions || {
          color: '#000000',
          type: 'square',
        },
        imageOptions: settings.imageOptions || {
          hideBackgroundDots: true,
          imageSize: 0.4,
          margin: 5,
        },
        image: settings.logo || undefined,
      };

      const qr = new QRCodeStyling(options as any);
      qrInstance.current = qr;

      if (downloadRef) {
        downloadRef.current = qr;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        qr.append(containerRef.current);
      }
    };

    renderQR();
  }, [shortId, settings, width, height, downloadRef]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#ffffff',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)',
        width: 'fit-content',
        margin: '0 auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    />
  );
}
