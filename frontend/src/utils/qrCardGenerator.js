import api from '../services/api';

/**
 * Validates and sanitizes a hex color code.
 */
export const getValidColor = (hex, fallback = '#0078d4') => {
  if (!hex || typeof hex !== 'string') return fallback;
  const cleaned = hex.trim();
  return /^#[0-9A-F]{6}$/i.test(cleaned) || /^#[0-9A-F]{3}$/i.test(cleaned) ? cleaned : fallback;
};

/**
 * Converts a hex color to rgba string.
 */
export const colorToRgba = (hex, alpha = 1, fallback = '#0078d4') => {
  const color = getValidColor(hex, fallback);
  let c = color.substring(1);
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Default fallback branding configuration for MSC PRPCEM
 */
export const DEFAULT_BRANDING = {
  club_name: 'Microsoft Student Club',
  chapter_name: 'PRPCEM Chapter',
  logo_path: 'logo.png',
  primary_color: '#0078d4',
  footer_text: 'Powered by Microsoft Student Club PRPCEM Quiz Platform',
  qr_logo_size: 28
};

let cachedBranding = null;

/**
 * Fetches branding from backend /api/branding or returns cache/default
 */
export const fetchBrandingConfig = async () => {
  if (cachedBranding) return cachedBranding;
  try {
    const res = await api.get('/api/branding');
    cachedBranding = {
      ...DEFAULT_BRANDING,
      ...(res.data || {})
    };
    return cachedBranding;
  } catch (err) {
    console.warn('Failed to load branding, using defaults:', err);
    return DEFAULT_BRANDING;
  }
};

/**
 * Resolves full logo URL
 */
export const getLogoUrl = (logoPath) => {
  if (!logoPath) return '/logo.png';
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://') || logoPath.startsWith('data:')) {
    return logoPath;
  }
  return logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
};

/**
 * Normalizes club name and chapter name to avoid duplicate prefixes or repetitive MSC text
 */
export const formatClubAndChapter = (branding) => {
  const rawClub = (branding?.club_name || 'Microsoft Student Club').trim();
  const rawChapter = (branding?.chapter_name || 'PRPCEM Chapter').trim();

  // Normalize club name: strip redundant trailing chapter names (e.g. "Microsoft Student Club PRPCEM")
  let clubName = rawClub.replace(/\s+PRPCEM$/i, '').trim();
  if (!clubName) clubName = 'Microsoft Student Club';

  // Normalize chapter name: remove redundant "Microsoft Student Club", "MSC-", "MSC ", etc.
  let chapterName = rawChapter
    .replace(/^Microsoft\s+Student\s+Club\s*/i, '')
    .replace(/^MSC[-\s]*/i, '')
    .trim();

  if (!chapterName) chapterName = 'PRPCEM';
  if (!chapterName.toLowerCase().includes('chapter')) {
    chapterName = `${chapterName} CHAPTER`;
  }

  return {
    clubName: clubName.toUpperCase(),
    chapterName: chapterName.toUpperCase()
  };
};

/**
 * Draws the official Microsoft Student Club branded QR card onto a canvas context.
 */
export const drawBrandedQRCard = (ctx, qrImage, quizData, brandData, logoImg) => {
  const W = 400;
  const H = 650;

  const branding = { ...DEFAULT_BRANDING, ...(brandData || {}) };
  const primaryColor = getValidColor(branding.primary_color, '#0078d4');
  
  // Format Header Lines cleanly without repetitive club/chapter strings
  const { clubName, chapterName } = formatClubAndChapter(branding);

  const footerText = branding.footer_text || 'Powered by Microsoft Student Club PRPCEM Quiz Platform';

  // 1. Clean White Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // 2. Azure-style Decorative Wave Paths
  ctx.strokeStyle = colorToRgba(primaryColor, 0.08);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.bezierCurveTo(100, 50, 300, 250, W, 150);
  ctx.stroke();

  ctx.strokeStyle = colorToRgba(primaryColor, 0.04);
  ctx.beginPath();
  ctx.moveTo(0, 480);
  ctx.bezierCurveTo(100, 550, 300, 380, W, 480);
  ctx.stroke();

  // 3. Subtle Dot Grid Pattern
  ctx.globalAlpha = 0.035;
  for (let x = 0; x < W; x += 16) {
    for (let y = 0; y < H; y += 16) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fillStyle = primaryColor;
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // 4. Accent Background Nodes
  ctx.fillStyle = colorToRgba(primaryColor, 0.07);
  ctx.beginPath();
  ctx.arc(40, 180, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(360, 520, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(330, 220, 6, 0, Math.PI * 2);
  ctx.fill();

  // 5. Top Color Accent Gradient Bar
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, primaryColor);
  grad.addColorStop(0.5, colorToRgba(primaryColor, 0.8));
  grad.addColorStop(1, primaryColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 8);

  // 6. Top Club Logo Circle
  if (logoImg) {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(200, 34, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.drawImage(logoImg, 178, 12, 44, 44);
  } else {
    // Microsoft 4-color grid fallback
    ctx.fillStyle = '#F25022';
    ctx.fillRect(188, 18, 11, 11);
    ctx.fillStyle = '#7FBA00';
    ctx.fillRect(201, 18, 11, 11);
    ctx.fillStyle = '#00A4EF';
    ctx.fillRect(188, 31, 11, 11);
    ctx.fillStyle = '#FFB900';
    ctx.fillRect(201, 31, 11, 11);
  }

  // 7. Club Name & Chapter Subtitle
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 13px Inter, "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(clubName, 200, 75);

  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 11px Inter, "Segoe UI", system-ui, sans-serif';
  ctx.fillText(chapterName, 200, 95);

  // 8. Separator Line
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 115);
  ctx.lineTo(360, 115);
  ctx.stroke();

  // 9. Quiz / Event Title & Subtitle/Category
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 16px Inter, "Segoe UI", system-ui, sans-serif';
  const rawTitle = (quizData?.title || 'Quiz Session').toUpperCase();
  const displayTitle = rawTitle.length > 34 ? rawTitle.slice(0, 34) + '...' : rawTitle;
  ctx.fillText(displayTitle, 200, 140);

  ctx.fillStyle = '#64748B';
  ctx.font = '600 10px Inter, "Segoe UI", system-ui, sans-serif';
  const rawSubtitle = (quizData?.subtitle || quizData?.event_name || quizData?.category || (quizData?.schedule_type ? `${quizData.schedule_type} ASSESSMENT` : 'SCHEDULED ASSESSMENT')).toUpperCase();
  const displaySubtitle = rawSubtitle.length > 42 ? rawSubtitle.slice(0, 42) + '...' : rawSubtitle;
  ctx.fillText(displaySubtitle, 200, 160);

  // 10. QR Code Frame Box
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(80, 185, 240, 240);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(80, 185, 240, 240);

  // 11. Draw QR Code Image
  if (qrImage) {
    ctx.drawImage(qrImage, 90, 195, 220, 220);
  }

  // 12. Center MSC Logo inside the QR Code
  if (logoImg) {
    const logoSize = branding.qr_logo_size !== undefined ? branding.qr_logo_size : 28;
    const L = Math.round(logoSize * 1.375); // ~38px
    const radius = Math.round(L / 2) + 3;

    // White circle cutout background behind the center logo
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(200, 305, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center logo image
    ctx.drawImage(logoImg, 200 - Math.round(L / 2), 305 - Math.round(L / 2), L, L);
  }

  // 13 & 14. Event vs Quiz Layout Differentiation
  const isEvent = Boolean(quizData?.isEvent || quizData?.is_event);

  if (isEvent) {
    // === EVENT REGISTRATION CARD ===
    // 13. Call-to-action prompt
    ctx.fillStyle = '#64748B';
    ctx.font = '600 11px Inter, "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Scan with camera to register, or visit link:', 200, 452);

    // 14. Prominent Full Registration Link Box (replaces slug box with complete link)
    const boxX = 35;
    const boxY = 468;
    const boxW = 330;
    const boxH = 100;
    const boxR = 12;

    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(boxX, boxY, boxW, boxH, boxR);
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Box Header Label
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 9px Inter, "Segoe UI", sans-serif';
    ctx.fillText('DIRECT REGISTRATION LINK', 200, boxY + 20);

    // Full Registration Link URL
    const eventHost = 'https://www.mscprpcem.tech';
    const slug = quizData?.custom_slug || quizData?.join_code || '';
    const fullUrl = quizData?.join_url || `${eventHost}/register/${slug}`;

    ctx.fillStyle = primaryColor;
    ctx.font = 'bold 12px Inter, "Segoe UI", monospace, sans-serif';

    const textMetrics = ctx.measureText(fullUrl);
    if (textMetrics.width <= 300) {
      ctx.fillText(fullUrl, 200, boxY + 56);
    } else {
      // Split cleanly across 2 lines so the link is never truncated
      let line1 = '';
      let line2 = '';

      if (fullUrl.includes('/register/')) {
        const parts = fullUrl.split('/register/');
        line1 = `${parts[0]}/register/`;
        line2 = parts[1] || '';
      } else {
        const mid = Math.floor(fullUrl.length / 2);
        const slashIdx = fullUrl.lastIndexOf('/', mid + 10);
        if (slashIdx > 15) {
          line1 = fullUrl.substring(0, slashIdx + 1);
          line2 = fullUrl.substring(slashIdx + 1);
        } else {
          line1 = fullUrl.substring(0, mid);
          line2 = fullUrl.substring(mid);
        }
      }

      ctx.font = 'bold 12px Inter, "Segoe UI", monospace, sans-serif';
      ctx.fillText(line1, 200, boxY + 48);
      ctx.font = 'bold 13px Inter, "Segoe UI", monospace, sans-serif';
      ctx.fillText(line2, 200, boxY + 70);
    }
  } else {
    // === QUIZ SESSION CARD ===
    // 13. Direct URL / Join Link
    ctx.fillStyle = '#64748B';
    ctx.font = '600 11px Inter, "Segoe UI", system-ui, sans-serif';
    const scanLabel = quizData?.scan_label || 'Scan with camera or visit:';
    ctx.fillText(scanLabel, 200, 455);

    const hostOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://quiz.mscprpcem.tech';
    const joinCode = quizData?.join_code || quizData?.custom_slug || '';
    const joinUrl = quizData?.join_url || (joinCode ? `${hostOrigin}/join/${joinCode}` : `${hostOrigin}/q/quiz`);
    
    let urlFont = 12;
    if (joinUrl.length > 40) urlFont = 11;
    if (joinUrl.length > 48) urlFont = 10;
    ctx.fillStyle = primaryColor;
    ctx.font = `bold ${urlFont}px Inter, "Segoe UI", monospace, sans-serif`;
    ctx.fillText(joinUrl, 200, 478);

    // 14. Unique Join Code Box
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(80, 505, 240, 70);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(80, 505, 240, 70);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 9px Inter, "Segoe UI", sans-serif';
    const codeLabel = quizData?.code_label || 'UNIQUE JOIN CODE';
    ctx.fillText(codeLabel, 200, 525);

    const codeVal = String(quizData?.join_code || quizData?.custom_slug || 'JOIN').toUpperCase();
    
    let fontSize = 28;
    if (codeVal.length > 8) fontSize = 22;
    if (codeVal.length > 14) fontSize = 16;
    if (codeVal.length > 20) fontSize = 13;

    ctx.fillStyle = primaryColor;
    ctx.font = `900 ${fontSize}px Inter, "Segoe UI", sans-serif`;
    ctx.fillText(codeVal, 200, 560);
  }

  // 15. Footer Text
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 8px Inter, "Segoe UI", system-ui, sans-serif';
  ctx.fillText(footerText, 200, 612);

  // 16. Bottom Gradient Accent Bar
  ctx.fillStyle = grad;
  ctx.fillRect(0, H - 4, W, 4);
};

/**
 * Downloads a branded QR card image as a PNG file.
 * Handles SVG serialization, canvas rendering, and browser download trigger.
 */
export const downloadBrandedQRCard = async ({
  svgElementId,
  quizData = {},
  brandData = null,
  fileName = null
}) => {
  try {
    const branding = brandData || await fetchBrandingConfig();
    const svgElement = document.getElementById(svgElementId);
    if (!svgElement) {
      console.error(`SVG element with id '${svgElementId}' not found.`);
      return;
    }

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const logoSrc = getLogoUrl(branding?.logo_path);

    const qrImage = new Image();
    qrImage.onload = () => {
      const renderAndDownload = (logoImg) => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 650;
        const ctx = canvas.getContext('2d');

        drawBrandedQRCard(ctx, qrImage, quizData, branding, logoImg);

        const pngUrl = canvas.toDataURL('image/png');
        const slugOrCode = quizData?.custom_slug || quizData?.join_code || 'item';
        const defaultPrefix = quizData?.isEvent ? 'msc-event' : 'quiz';
        const defaultName = fileName || `${defaultPrefix}-${slugOrCode}.png`;

        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = defaultName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobURL);
      };

      if (logoSrc) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => renderAndDownload(logoImg);
        logoImg.onerror = () => renderAndDownload(null);
        logoImg.src = logoSrc;
      } else {
        renderAndDownload(null);
      }
    };

    qrImage.onerror = () => {
      console.error('Failed to load QR image for download');
      URL.revokeObjectURL(blobURL);
    };

    qrImage.src = blobURL;
  } catch (error) {
    console.error('Error generating branded QR card:', error);
  }
};
