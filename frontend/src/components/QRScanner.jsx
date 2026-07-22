import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Upload, RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';

export default function QRScanner({ onScanSuccess }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'upload'
  const [cameraError, setCameraError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  // Initialize camera scanner
  useEffect(() => {
    if (activeTab !== 'camera') return;

    let isMounted = true;
    const scannerId = 'qr-reader-viewport';

    const startCamera = async () => {
      try {
        setCameraError('');
        setScanning(true);

        const html5Qrcode = new Html5Qrcode(scannerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false
        });
        html5QrcodeRef.current = html5Qrcode;

        await html5Qrcode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 }
          },
          (decodedText) => {
            if (!isMounted) return;
            handleDecodedText(decodedText);
          },
          (errorMessage) => {
            // Ignore frame-by-frame parse errors
          }
        );
      } catch (err) {
        if (!isMounted) return;
        console.error('Camera QR start error:', err);
        setScanning(false);
        setCameraError(
          err.message || 'Camera permission denied or camera not available. Try uploading an image file instead.'
        );
      }
    };

    // Small delay to ensure DOM element is mounted
    const timer = setTimeout(() => {
      startCamera();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrcodeRef.current) {
        if (html5QrcodeRef.current.isScanning) {
          html5QrcodeRef.current.stop().catch((e) => console.error('Stop error:', e));
        }
      }
    };
  }, [activeTab]);

  // Extract join code or URL parameter
  const handleDecodedText = (text) => {
    if (!text) return;

    let code = text.trim();

    // Check if full URL (e.g., https://site.com/join/ABC123)
    if (code.includes('/join/')) {
      const parts = code.split('/join/');
      if (parts[1]) {
        code = parts[1].split('?')[0].split('#')[0].substring(0, 6).toUpperCase();
      }
    } else {
      // Direct join code
      code = code.replace(/[^A-Z0-9]/gi, '').substring(0, 6).toUpperCase();
    }

    if (code.length === 6) {
      setScannedCode(code);
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current.stop().catch(() => {});
      }
      onScanSuccess(code);
    } else {
      setUploadError(`Scanned content "${text}" did not contain a valid 6-character Join Code.`);
    }
  };

  // Handle image file upload scanning
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');
    try {
      const html5Qrcode = new Html5Qrcode('qr-file-temp', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false
      });

      const decodedText = await html5Qrcode.scanFile(file, true);
      handleDecodedText(decodedText);
    } catch (err) {
      console.error('File QR Scan Error:', err);
      setUploadError('No QR code detected in the uploaded image. Please upload a clear photo or screenshot of the QR code.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 text-center animate-fade-in">
      {/* Hidden container for file scan processing */}
      <div id="qr-file-temp" className="hidden" />

      {/* Tab Switcher: Camera vs Upload */}
      <div className="grid grid-cols-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'camera'
              ? 'bg-white text-brand-blue shadow-sm font-extrabold'
              : 'text-brand-textMuted hover:text-brand-textMain'
          }`}
        >
          <Camera size={14} />
          <span>Live Camera</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-brand-blue shadow-sm font-extrabold'
              : 'text-brand-textMuted hover:text-brand-textMain'
          }`}
        >
          <Upload size={14} />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Mode 1: Live Camera View */}
      {activeTab === 'camera' && (
        <div className="space-y-3">
          <div className="relative w-full aspect-square max-w-[280px] mx-auto bg-black rounded-2xl overflow-hidden border-2 border-brand-blue/30 shadow-md">
            <div id="qr-reader-viewport" className="w-full h-full object-cover" />

            {/* Scanning Line Animation overlay */}
            {scanning && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-[scan_2s_ease-in-out_infinite]" />
                <div className="text-[10px] font-extrabold text-white/90 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full mx-auto uppercase tracking-widest border border-white/20">
                  Align QR in frame
                </div>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="bg-red-50 border border-red-150 p-4 rounded-xl text-left space-y-2">
              <div className="flex items-center space-x-2 text-red-700 text-xs font-bold">
                <AlertCircle size={15} />
                <span>Camera Unavailable</span>
              </div>
              <p className="text-[11px] text-red-600 leading-relaxed font-medium">{cameraError}</p>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="mt-1 text-xs font-extrabold text-brand-blue hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Upload size={12} />
                <span>Switch to Upload QR Image</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Upload Image View */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <label className="border-2 border-dashed border-zinc-300 hover:border-brand-blue rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-zinc-50/60 hover:bg-brand-lightBlue/30 transition-all duration-200 group">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-brand-lightBlue text-brand-blue flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-inner border border-brand-blue/10">
              <ImageIcon size={28} />
            </div>
            <span className="text-xs font-extrabold text-brand-textMain group-hover:text-brand-blue transition-colors">
              Choose QR Code Image / Screenshot
            </span>
            <span className="text-[10px] font-semibold text-brand-textMuted mt-1">
              Supports PNG, JPG, WEBP, or device screenshot
            </span>
          </label>

          {uploadError && (
            <div className="bg-red-50 border border-red-150 p-3.5 rounded-xl text-xs text-red-700 font-semibold flex items-start space-x-2 text-left">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Scanned Feedback */}
      {scannedCode && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-800 text-xs font-extrabold flex items-center justify-center space-x-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>QR Detected! Code: <strong>{scannedCode}</strong></span>
        </div>
      )}
    </div>
  );
}
