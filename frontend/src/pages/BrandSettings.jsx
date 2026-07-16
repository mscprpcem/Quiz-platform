import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import {
  Upload,
  Trash2,
  Save,
  Image as ImageIcon,
  Type,
  Palette,
  Eye,
  Check,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';

export default function BrandSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Editable form state
  const [form, setForm] = useState({
    club_name: '',
    chapter_name: '',
    primary_color: '#2563EB',
    footer_text: '',
    qr_logo_size: 28
  });

  const fileInputRef = useRef(null);

  // Load branding settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/branding');
      setSettings(res.data);
      setForm({
        club_name: res.data.club_name || '',
        chapter_name: res.data.chapter_name || '',
        primary_color: res.data.primary_color || '#2563EB',
        footer_text: res.data.footer_text || '',
        qr_logo_size: res.data.qr_logo_size !== undefined ? res.data.qr_logo_size : 28
      });
    } catch (err) {
      console.error('Error loading branding settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Save text fields
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!form.club_name.trim() || !form.chapter_name.trim()) {
      setSaveError('Club Name and Chapter Name are required.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.put('/api/branding', form);
      setSettings(res.data);
      setSaveSuccess('Branding settings saved successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // Upload logo
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      setSaveError('Logo file must be under 2MB.');
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    try {
      setUploading(true);
      setSaveError('');
      const res = await api.post('/api/branding/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSettings(res.data.settings);
      setSaveSuccess('Logo uploaded successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to upload logo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete logo
  const handleDeleteLogo = async () => {
    try {
      setUploading(true);
      setSaveError('');
      const res = await api.delete('/api/branding/logo');
      setSettings(res.data.settings);
      setSaveSuccess('Logo removed successfully.');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to remove logo.');
    } finally {
      setUploading(false);
    }
  };

  // Compute a darker shade for gradient
  const getDarkerColor = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const factor = 0.7;
    return `#${Math.round(r * factor).toString(16).padStart(2, '0')}${Math.round(g * factor).toString(16).padStart(2, '0')}${Math.round(b * factor).toString(16).padStart(2, '0')}`;
  };

  // Compute a lighter shade for badges
  const getLighterColor = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.08)`;
  };

  const logoUrl = settings?.logo_path ? `/${settings.logo_path}` : null;
  const previewColor = form.primary_color || '#2563EB';
  const previewDarkColor = getDarkerColor(previewColor);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-brand-textMuted font-semibold">
        <RefreshCw size={18} className="animate-spin mr-2" />
        Loading branding settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-800 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">

        {/* Page Header */}
        <div className="bg-white border border-brand-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple"></div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-lightBlue text-brand-blue rounded-xl flex items-center justify-center border border-zinc-100">
              <Palette size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-brand-textMain tracking-tight">Branding Settings</h1>
              <p className="text-xs sm:text-sm text-brand-textMuted mt-0.5">Customize your logo, club name, and QR share card appearance.</p>
            </div>
          </div>
        </div>

      {/* Success / Error Alerts */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 animate-fade-in">
            <Check size={16} className="text-emerald-650" />
            <span>{saveSuccess}</span>
          </div>
        )}
        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 animate-fade-in">
            <AlertCircle size={16} />
            <span>{saveError}</span>
            <button onClick={() => setSaveError('')} className="ml-auto text-red-600 hover:text-red-700 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left Column - Settings Form */}
        <div className="lg:col-span-3 space-y-6">

          {/* Logo Upload Section */}
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center space-x-2">
              <ImageIcon size={18} className="text-zinc-500" />
              <h2 className="text-base font-black text-brand-textMain tracking-tight">Organization Logo</h2>
            </div>

            <div className="flex items-start space-x-6">
              {/* Current Logo Preview */}
              <div className="flex-shrink-0">
                <div className="w-28 h-28 rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Organization Logo"
                      className="w-full h-full object-contain p-2 bg-white"
                    />
                  ) : (
                    <div className="text-center text-zinc-550">
                      <ImageIcon size={28} className="mx-auto mb-1 opacity-30 text-zinc-400" />
                      <span className="text-[10px] font-semibold text-zinc-400">No Logo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Controls */}
              <div className="flex-grow space-y-3">
                <p className="text-xs text-brand-textMuted leading-relaxed">
                  Upload your club or organization logo. It will appear in QR share cards and download exports.
                  Recommended: square image, at least 200 x 200px. Max 2MB.
                </p>
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 shadow-sm ${
                      uploading
                        ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300'
                    }`}
                  >
                    <Upload size={14} />
                    <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                  </label>

                  {logoUrl && (
                    <button
                      onClick={handleDeleteLogo}
                      disabled={uploading}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-650 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-brand-textMuted">
                  Accepted formats: PNG, JPG, SVG, WebP
                </p>
              </div>
            </div>
          </div>

          {/* Text Configuration Section */}
          <form onSubmit={handleSaveSettings}>
            <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center space-x-2">
                <Type size={18} className="text-zinc-500" />
                <h2 className="text-base font-black text-brand-textMain tracking-tight">Card Text & Colors</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest mb-1.5">
                    Club / Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.club_name}
                    onChange={(e) => setForm(prev => ({ ...prev, club_name: e.target.value }))}
                    placeholder="Microsoft Student Club"
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-sm text-brand-textMain placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest mb-1.5">
                    Chapter / Subtitle
                  </label>
                  <input
                    type="text"
                    required
                    value={form.chapter_name}
                    onChange={(e) => setForm(prev => ({ ...prev, chapter_name: e.target.value }))}
                    placeholder="MSC-PRPCEM Chapter"
                    className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-sm text-brand-textMain placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest mb-1.5">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={form.footer_text}
                  onChange={(e) => setForm(prev => ({ ...prev, footer_text: e.target.value }))}
                  placeholder="Powered by Microsoft Student Club Quiz Platform"
                  className="w-full px-3.5 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-sm text-brand-textMain placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest mb-1.5">
                  Primary Brand Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded-xl border border-brand-border cursor-pointer shadow-sm bg-zinc-50 p-1"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={(e) => setForm(prev => ({ ...prev, primary_color: e.target.value }))}
                    maxLength={7}
                    className="w-28 px-3 py-2.5 border border-brand-border rounded-xl bg-brand-bgLight/50 text-sm text-brand-textMain font-mono font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all duration-200"
                  />
                  <div
                    className="h-10 flex-grow rounded-xl border border-brand-border shadow-inner"
                    style={{ background: `linear-gradient(135deg, ${previewColor}, ${previewDarkColor})` }}
                  ></div>
                </div>
              </div>

              {logoUrl && (
                <div>
                  <label className="block text-[10px] font-bold text-brand-textMuted uppercase tracking-widest mb-1.5">
                    QR Code Center Logo Size
                  </label>
                  <div className="flex items-center space-x-3 bg-brand-bgLight border border-brand-border rounded-xl p-3">
                    <input
                      type="range"
                      min={16}
                      max={50}
                      value={form.qr_logo_size}
                      onChange={(e) => setForm(prev => ({ ...prev, qr_logo_size: parseInt(e.target.value, 10) }))}
                      className="flex-grow h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                    />
                    <span className="text-xs font-mono font-bold text-zinc-650 w-8 text-right">
                      {form.qr_logo_size}px
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:bg-zinc-200 text-white font-bold py-2.5 rounded-xl transition-all duration-200 active:scale-[0.97] shadow-sm cursor-pointer"
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save Branding Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Live QR Card Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm space-y-4 sticky top-24">
            <div className="flex items-center space-x-2">
              <Eye size={18} className="text-brand-textMuted" />
              <h2 className="text-base font-black text-brand-textMain tracking-tight">Live Card Preview</h2>
            </div>

            <p className="text-[11px] text-brand-textMuted leading-relaxed">
              This is how your QR share card will look when downloaded or displayed in modals.
            </p>

            {/* Preview Card */}
            <div className="bg-white bg-azure-mesh border border-zinc-200 rounded-2xl overflow-hidden shadow-md mx-auto max-w-[280px] relative text-slate-900">
              {/* Top colored bar */}
              <div
                className="h-2 w-full animate-[azureFlow_4s_ease_infinite]"
                style={{
                  background: `linear-gradient(90deg, ${previewColor}, ${previewDarkColor}, ${previewColor})`,
                  backgroundSize: '200% 200%'
                }}
              ></div>

              {/* Decorative dot pattern background */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]" style={{
                backgroundImage: `radial-gradient(${previewColor} 1px, transparent 1px)`,
                backgroundSize: '16px 16px'
              }}></div>

              {/* Floating Azure AI styled nodes */}
              <div className="absolute top-12 left-6 w-2.5 h-2.5 rounded-full pointer-events-none decor-node opacity-20" style={{ backgroundColor: previewColor }}></div>
              <div className="absolute bottom-20 right-10 w-4 h-4 rounded-full pointer-events-none decor-node-delay-1 opacity-20" style={{ backgroundColor: previewDarkColor }}></div>
              <div className="absolute top-1/2 right-4 w-2 h-2 rounded-full pointer-events-none decor-node-delay-2 opacity-20" style={{ backgroundColor: previewColor }}></div>

              <div className="p-5 space-y-3 text-center relative z-10">
                {/* Logo */}
                <div className="flex flex-col items-center space-y-1.5">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-[2px] w-5 h-5">
                      <div className="bg-[#f25022] rounded-[1px]"></div>
                      <div className="bg-[#7fba00] rounded-[1px]"></div>
                      <div className="bg-[#00a4ef] rounded-[1px]"></div>
                      <div className="bg-[#ffb900] rounded-[1px]"></div>
                    </div>
                  )}
                  <h3 className="text-[9px] font-extrabold tracking-wider uppercase text-zinc-550">
                    {form.club_name || 'Club Name'}
                  </h3>
                  <span
                    className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ color: previewColor, backgroundColor: getLighterColor(previewColor) }}
                  >
                    {form.chapter_name || 'Chapter Name'}
                  </span>
                </div>

                {/* Separator */}
                <div className="border-t border-zinc-100"></div>

                {/* Sample quiz info */}
                <div>
                  <h2 className="text-xs font-black text-zinc-900 uppercase leading-tight">SAMPLE QUIZ TITLE</h2>
                  <p className="text-[7px] text-zinc-450 font-bold uppercase tracking-widest mt-0.5">Event Name Preview</p>
                </div>

                {/* QR Code */}
                <div className="inline-block bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                  <QRCodeSVG
                    value="https://example.com/join/ABC123"
                    size={100}
                    level="H"
                    includeMargin={false}
                    imageSettings={logoUrl ? {
                      src: logoUrl,
                      x: undefined,
                      y: undefined,
                      height: Math.round(form.qr_logo_size * (100 / 140)),
                      width: Math.round(form.qr_logo_size * (100 / 140)),
                      excavate: true,
                    } : undefined}
                  />
                </div>

                {/* Scan text */}
                <div className="text-[9px] font-semibold text-zinc-500">
                  <p>Scan with camera or visit:</p>
                  <p className="font-bold underline mt-0.5" style={{ color: previewDarkColor }}>
                    example.com/join/ABC123
                  </p>
                </div>

                {/* Join Code Box */}
                <div className="bg-zinc-50 border border-zinc-100 p-2 rounded-lg">
                  <span className="block text-[7px] font-bold text-zinc-450 uppercase tracking-widest">Unique Join Code</span>
                  <span className="block text-base font-black tracking-widest mt-0.5" style={{ color: previewColor }}>
                    ABC123
                  </span>
                </div>

                {/* Footer */}
                <p className="text-[7px] text-zinc-500 font-semibold truncate">
                  {form.footer_text || 'Footer text'}
                </p>
              </div>
            </div>

            <p className="text-[10px] text-brand-textMuted text-center">
              Actual card will use real quiz data and full-size QR code.
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
