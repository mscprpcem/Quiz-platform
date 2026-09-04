let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  // nodemailer optional in dev/local test environments
}
const crypto = require('crypto');
require('dotenv').config();

// Singleton Transporter Instance
let transporter = null;

/**
 * Resolve the sender address dynamically to prevent SPF/DMARC spoofing flags.
 * If EMAIL_FROM is explicitly set, use it.
 * Otherwise, align the sender address directly with the authenticated SMTP_USER.
 */
const getSenderAddress = () => {
  if (process.env.EMAIL_FROM && process.env.EMAIL_FROM.trim()) {
    return process.env.EMAIL_FROM.trim();
  }
  const user = process.env.SMTP_USER;
  if (user && user.includes('@')) {
    return `"Microsoft Student Club PRPCEM" <${user.trim()}>`;
  }
  return '"Microsoft Student Club PRPCEM" <mlsc@prpotepatilengg.ac.in>';
};

/**
 * Resolve the default Reply-To address
 */
const getReplyToAddress = () => {
  return process.env.REPLY_TO || process.env.SMTP_USER || 'mlsc@prpotepatilengg.ac.in';
};

/**
 * Generate RFC 5322 compliant Message-ID using the sender's domain
 */
const generateMessageId = (senderEmail) => {
  const domain = (senderEmail && senderEmail.includes('@')) 
    ? senderEmail.split('@')[1].replace(/[<>]/g, '').trim() 
    : 'prpotepatilengg.ac.in';
  return `<${Date.now()}.${crypto.randomBytes(8).toString('hex')}@${domain}>`;
};

/**
 * Create an optimized Nodemailer transporter configured for College Mail & Enterprise SMTP
 * (Supports Microsoft 365, Google Workspace, Zimbra, Exchange, and standard SMTP)
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    const config = {
      host: host.trim(),
      port,
      secure, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: {
        user: user.trim(),
        pass: pass.trim()
      },
      // Connection Pooling for high performance and avoiding mail server rate-limits
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
      // Socket timeouts to prevent hanging processes
      connectionTimeout: 15000, // 15 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 30000,     // 30 seconds
      // TLS Settings (compatible with College servers with strict or custom certificates)
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: process.env.SMTP_IGNORE_TLS === 'true' ? false : (process.env.NODE_ENV === 'production')
      }
    };

    // If port 587, require TLS upgrade (Standard for Office 365 / Google Workspace / College SMTP)
    if (port === 587) {
      config.requireTLS = true;
    }

    const transport = nodemailer.createTransport(config);

    // Verify SMTP connection in background without blocking startup
    transport.verify((error) => {
      if (error) {
        console.warn('⚠️ [EMAIL SERVICE] SMTP Connection verification warning:', error.message);
        console.warn('💡 Tip: Verify SMTP_HOST, SMTP_USER, and App Password in .env');
      } else {
        console.log(`✅ [EMAIL SERVICE] Connected securely to SMTP server: ${host}:${port} (${user})`);
      }
    });

    return transport;
  }

  // Development / Test Fallback Transporter when SMTP is not configured
  return {
    sendMail: async (mailOptions) => {
      console.log('\n---------------- EMAIL SERVICE (DEV/MOCK MODE) ----------------');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`From: ${mailOptions.from || getSenderAddress()}`);
      console.log(`Reply-To: ${mailOptions.replyTo || getReplyToAddress()}`);
      console.log('Content (Snippet):', (mailOptions.text || mailOptions.html || '').substring(0, 160) + '...');
      console.log('---------------------------------------------------------------\n');
      return { messageId: `mock_${crypto.randomBytes(8).toString('hex')}`, response: '250 Mock Email Dispatched' };
    }
  };
};

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Diagnostic helper to test SMTP connectivity
 */
const verifyEmailConfiguration = async () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  if (!host || !user) {
    return { configured: false, message: 'SMTP credentials not configured in .env' };
  }
  try {
    const transport = getTransporter();
    if (typeof transport.verify === 'function') {
      await transport.verify();
      return { configured: true, connected: true, host, user };
    }
    return { configured: true, connected: true, host, user, note: 'Mock mode or custom transport' };
  } catch (err) {
    return { configured: true, connected: false, host, user, error: err.message };
  }
};

/**
 * Clean Modern Institutional HTML Email Wrapper
 * Built with bulletproof table layouts and inline CSS for 100% rendering across
 * Microsoft Outlook, Apple Mail, Gmail (Web & Mobile), and Yahoo.
 */
const renderHtmlWrapper = ({ title, preheader, content }) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <meta name="format-detection" content="telephone=no" />
  <title>${title}</title>
  <style type="text/css">
    /* Base resets */
    *, *:before, *:after { box-sizing: border-box; }
    body, table, td, a, p, span, div, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; max-width: 100%; height: auto; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; overflow-x: hidden; }
    
    /* Responsive phone optimization */
    @media screen and (max-width: 600px) {
      .outer-wrap-table { padding: 12px 6px !important; }
      .email-container { width: 100% !important; max-width: 100% !important; border-radius: 8px !important; }
      .mobile-header { padding: 22px 16px !important; }
      .mobile-p-20 { padding: 22px 16px !important; }
      .mobile-footer { padding: 18px 12px !important; }
      .mobile-title { font-size: 19px !important; line-height: 25px !important; }
      .mobile-badge { font-size: 10px !important; padding: 3px 10px !important; letter-spacing: 0.5px !important; }
      .otp-code-text { font-size: 30px !important; letter-spacing: 5px !important; }
      .otp-box-cell { padding: 16px 8px !important; }
      .mobile-btn { display: block !important; width: 100% !important; max-width: 100% !important; padding: 13px 16px !important; box-sizing: border-box !important; text-align: center !important; }
      .detail-label-cell { width: 32% !important; padding: 8px 6px !important; font-size: 12px !important; }
      .detail-value-cell { width: 68% !important; padding: 8px 6px !important; font-size: 12px !important; }
      .mobile-track-card { padding: 10px 12px !important; margin-bottom: 8px !important; }
    }
    @media screen and (max-width: 380px) {
      .outer-wrap-table { padding: 6px 2px !important; }
      .mobile-header { padding: 18px 12px !important; }
      .mobile-p-20 { padding: 18px 12px !important; }
      .mobile-title { font-size: 17px !important; line-height: 22px !important; }
      .otp-code-text { font-size: 26px !important; letter-spacing: 4px !important; }
      .detail-label-cell { width: 34% !important; padding: 6px 4px !important; font-size: 11px !important; }
      .detail-value-cell { width: 66% !important; padding: 6px 4px !important; font-size: 11px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- Anti-Spam Compliant Preview Text -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #f1f5f9;">
    ${preheader || title}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="outer-wrap-table" style="background-color: #f1f5f9; padding: 24px 8px; width: 100%; table-layout: fixed; box-sizing: border-box;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 580px; width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05); table-layout: fixed; box-sizing: border-box;">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" class="mobile-header" style="background-color: #0f172a; padding: 26px 24px; border-bottom: 3px solid #2563eb; box-sizing: border-box; word-break: break-word;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" class="mobile-badge" style="background-color: rgba(37, 99, 235, 0.2); border: 1px solid #3b82f6; border-radius: 20px; padding: 4px 14px; color: #93c5fd; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                    Microsoft Student Club • PRPCEM
                  </td>
                </tr>
              </table>
              <h1 class="mobile-title" style="margin: 12px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 28px; letter-spacing: -0.3px; word-break: break-word; overflow-wrap: break-word;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="mobile-p-20" style="padding: 32px 28px; color: #334155; font-size: 15px; line-height: 1.65; background-color: #ffffff; box-sizing: border-box; word-break: break-word; overflow-wrap: break-word;">
              ${content}
            </td>
          </tr>

          <!-- Institutional Footer -->
          <tr>
            <td class="mobile-footer" style="padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; box-sizing: border-box; word-break: break-word; overflow-wrap: break-word;">
              <p style="margin: 0 0 4px 0; font-weight: 700; color: #1e293b; font-size: 13px;">
                Microsoft Student Club (MSC)
              </p>
              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px;">
                P.R. Pote (Patil) College of Engineering &amp; Management, Amravati
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8; word-break: break-all;">
                Support: <a href="mailto:mlsc@prpotepatilengg.ac.in" style="color: #2563eb; text-decoration: none; font-weight: 600; word-break: break-all;">mlsc@prpotepatilengg.ac.in</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Send 6-Digit OTP Verification Email (Simple, Clean, and Highly Deliverable)
 */
const sendOtpEmail = async ({ to, name, otp, type = 'registration' }) => {
  const transport = getTransporter();
  const userName = name || (to ? to.split('@')[0] : 'Student');
  const fromAddr = getSenderAddress();
  const replyToAddr = getReplyToAddress();

  let subject = `${otp} is your verification code — MSC PRPCEM`;
  let heading = 'Verification Code';
  let description = 'Use the 6-digit verification code below to complete your verification:';

  if (type === 'password_reset') {
    subject = `${otp} is your password reset code — MSC PRPCEM`;
    heading = 'Password Reset Code';
    description = 'Use the 6-digit code below to reset your password:';
  } else if (type === 'login') {
    subject = `${otp} is your login code — MSC PRPCEM`;
    heading = 'Security Login Code';
    description = 'Use the 6-digit code below to sign in to your account:';
  } else if (type === 'quiz') {
    subject = `${otp} is your quiz access code — MSC PRPCEM`;
    heading = 'Quiz Access Code';
    description = 'Use the 6-digit code below to access your quiz:';
  }

  const html = renderHtmlWrapper({
    title: heading,
    preheader: `Your verification code is ${otp}. Valid for 15 minutes.`,
    content: `
      <p style="margin-top: 0; font-size: 15px; color: #1e293b;">Hello <strong>${userName}</strong>,</p>
      <p style="font-size: 15px; color: #334155; margin-bottom: 20px; line-height: 1.6;">${description}</p>
      
      <!-- OTP Box -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; table-layout: fixed; box-sizing: border-box;">
        <tr>
          <td align="center" class="otp-box-cell" style="background-color: #eff6ff; border: 2px dashed #2563eb; border-radius: 12px; padding: 22px 14px; box-sizing: border-box; word-break: break-word;">
            <div class="otp-code-text" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; line-height: 1.1; margin: 0 auto; text-align: center;">
              ${otp}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 10px; font-weight: 600; line-height: 1.4;">
              ⏱️ Valid for 15 minutes • Do not share this code
            </div>
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; margin-top: 20px; margin-bottom: 0; line-height: 1.5;">
        If you did not request this code, you can safely ignore this email.
      </p>
    `
  });

  const plainText = `Hello ${userName},\n\nYour 6-digit verification code is: ${otp}\n\nThis code is valid for 15 minutes.\nIf you did not request this code, please ignore this email.\n\n—\nMicrosoft Student Club (MSC)\nP.R. Pote (Patil) College of Engineering & Management, Amravati\nSupport: ${replyToAddr}`;

  return transport.sendMail({
    from: fromAddr,
    to: to.trim(),
    replyTo: replyToAddr,
    subject,
    text: plainText,
    html,
    messageId: generateMessageId(fromAddr),
    headers: {
      'X-Priority': '1', // High priority for OTP
      'X-MSMail-Priority': 'High',
      'Importance': 'High',
      'X-Mailer': 'MSC-PRPCEM-QuizPlatform'
    }
  });
};

/**
 * Send Scheduled Quiz Reminder Email
 */
const sendQuizReminderEmail = async ({ to, name, quizTitle, eventName, startTime, directUrl, joinCode }) => {
  const transport = getTransporter();
  const userName = name || (to ? to.split('@')[0] : 'Learner');
  const fromAddr = getSenderAddress();
  const replyToAddr = getReplyToAddress();
  const dateStr = startTime ? new Date(startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'Soon';
  const targetQuizTitle = quizTitle || 'Live Assessment';
  const quizUrl = directUrl || 'https://quiz.mscprpcem.tech';

  const html = renderHtmlWrapper({
    title: 'Quiz Reminder',
    preheader: `Reminder: ${targetQuizTitle} is starting soon — join code: ${joinCode || 'LIVE'}`,
    content: `
      <p style="margin-top: 0; font-size: 15px; color: #1e293b;">Hello <strong>${userName}</strong>,</p>
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Get ready! Your scheduled challenge <strong>${targetQuizTitle}</strong>${eventName ? ` (${eventName})` : ''} is starting soon.
      </p>
      
      <!-- Quiz Schedule Box -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; table-layout: fixed; box-sizing: border-box;">
        <tr>
          <td class="mobile-stack-card" style="padding: 16px 18px; word-break: break-word; overflow-wrap: break-word;">
            <p style="margin: 4px 0; color: #334155; font-size: 14px; word-break: break-word;"><strong>📅 Start Time:</strong> ${dateStr} (IST)</p>
            <p style="margin: 8px 0 4px 0; color: #334155; font-size: 14px; word-break: break-word;">
              <strong>🔑 Join Code:</strong> 
              <code style="background-color: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 4px; font-size: 15px; font-weight: 800; letter-spacing: 1px; font-family: monospace; display: inline-block;">${joinCode || 'LIVE'}</code>
            </p>
            ${eventName ? `<p style="margin: 8px 0 4px 0; color: #64748b; font-size: 13px; word-break: break-word;"><strong>🏷️ Event:</strong> ${eventName}</p>` : ''}
          </td>
        </tr>
      </table>

      <!-- Action Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; table-layout: fixed;">
        <tr>
          <td align="center">
            <a href="${quizUrl}" target="_blank" class="mobile-btn" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); text-align: center; max-width: 100%; box-sizing: border-box;">
              Start / Join Quiz Now &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0; word-break: break-all; overflow-wrap: anywhere;">
        Direct link: <a href="${quizUrl}" style="color: #2563eb; word-break: break-all; overflow-wrap: anywhere;">${quizUrl}</a>
      </p>
    `
  });

  const plainText = `Hello ${userName},\n\nYour quiz "${targetQuizTitle}" is starting at ${dateStr} (IST).\nJoin Code: ${joinCode || 'LIVE'}\nDirect Link: ${quizUrl}\n\nGood luck!\n\n—\nMicrosoft Student Club (MSC)\nP.R. Pote (Patil) College of Engineering & Management, Amravati\nSupport: ${replyToAddr}`;

  return transport.sendMail({
    from: fromAddr,
    to: to.trim(),
    replyTo: replyToAddr,
    subject: `Reminder: ${targetQuizTitle} — Starting ${dateStr}`,
    text: plainText,
    html,
    messageId: generateMessageId(fromAddr),
    headers: {
      'X-Mailer': 'MSC-PRPCEM-QuizPlatform',
      'List-Unsubscribe': `<mailto:${replyToAddr}?subject=unsubscribe>`
    }
  });
};

/**
 * Send Instant Event Registration Confirmation Email
 * Used when a student registers on mscprpcem-website or the Quiz Platform.
 */
const sendEventRegistrationEmail = async ({
  to,
  name,
  eventName,
  eventDate,
  eventVenue,
  registrationId,
  college,
  branch,
  year,
  tracks = [],
  directUrl
}) => {
  const transport = getTransporter();
  const userName = name || (to ? to.split('@')[0] : 'Student');
  const fromAddr = getSenderAddress();
  const replyToAddr = getReplyToAddress();
  const targetEventName = eventName || 'MSC PRPCEM Event';
  const portalUrl = directUrl || 'https://www.mscprpcem.tech';

  let tracksHtml = '';
  let tracksPlainText = '';
  if (tracks && tracks.length > 0) {
    tracksHtml = `
      <div style="margin: 20px 0; padding: 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; box-sizing: border-box; width: 100%;">
        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">
          Included Assessment Tracks / Quizzes
        </p>
        ${tracks.map(t => `
          <div class="mobile-track-card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; word-break: break-word; box-sizing: border-box;">
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px; word-break: break-word;">
              ${t.title}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: ${t.direct_url ? '6px' : '0'};">
              Join Code: <code style="background-color: #eff6ff; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 12px; font-family: monospace;">${t.join_code || 'LIVE'}</code>
            </div>
            ${t.direct_url ? `<div><a href="${t.direct_url}" target="_blank" style="color: #2563eb; font-size: 12px; font-weight: 600; text-decoration: none; word-break: break-all;">Launch Assessment &rarr;</a></div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
    tracksPlainText = `\nIncluded Assessment Tracks:\n` + tracks.map(t => `• ${t.title} (Join Code: ${t.join_code || 'LIVE'})${t.direct_url ? ` - Link: ${t.direct_url}` : ''}`).join('\n') + '\n';
  }

  // Summary table rows (fluid widths with word wrapping)
  const detailRows = [
    `<tr>
      <td class="detail-label-cell" style="padding: 9px 12px; color: #64748b; font-size: 13px; width: 32%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word;">Event</td>
      <td class="detail-value-cell" style="padding: 9px 12px; color: #0f172a; font-size: 13px; font-weight: 600; width: 68%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${targetEventName}</td>
    </tr>`,
    `<tr>
      <td class="detail-label-cell" style="padding: 9px 12px; color: #64748b; font-size: 13px; width: 32%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word;">Participant</td>
      <td class="detail-value-cell" style="padding: 9px 12px; color: #0f172a; font-size: 13px; font-weight: 600; width: 68%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${userName}</td>
    </tr>`,
    college ? `<tr>
      <td class="detail-label-cell" style="padding: 9px 12px; color: #64748b; font-size: 13px; width: 32%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word;">College</td>
      <td class="detail-value-cell" style="padding: 9px 12px; color: #334155; font-size: 13px; width: 68%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${college}</td>
    </tr>` : '',
    (branch || year) ? `<tr>
      <td class="detail-label-cell" style="padding: 9px 12px; color: #64748b; font-size: 13px; width: 32%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word;">Branch / Year</td>
      <td class="detail-value-cell" style="padding: 9px 12px; color: #334155; font-size: 13px; width: 68%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${[branch, year].filter(Boolean).join(' • ')}</td>
    </tr>` : '',
    registrationId ? `<tr>
      <td class="detail-label-cell" style="padding: 9px 12px; color: #64748b; font-size: 13px; width: 32%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word;">Registration ID</td>
      <td class="detail-value-cell" style="padding: 9px 12px; color: #2563eb; font-size: 13px; font-weight: 700; font-family: monospace; width: 68%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-all; overflow-wrap: anywhere;">${registrationId}</td>
    </tr>` : '',
    eventDate ? `<tr>
      <td class="detail-label-cell" style="padding: 9px 12px; color: #64748b; font-size: 13px; width: 32%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word;">Date &amp; Time</td>
      <td class="detail-value-cell" style="padding: 9px 12px; color: #334155; font-size: 13px; width: 68%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${eventDate}</td>
    </tr>` : '',
    eventVenue ? `<tr>
      <td class="detail-label-cell" style="padding: 9px 12px; color: #64748b; font-size: 13px; width: 32%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word;">Venue</td>
      <td class="detail-value-cell" style="padding: 9px 12px; color: #334155; font-size: 13px; width: 68%; border-bottom: 1px solid #f1f5f9; vertical-align: top; word-break: break-word; overflow-wrap: break-word;">${eventVenue}</td>
    </tr>` : ''
  ].filter(Boolean).join('');

  const html = renderHtmlWrapper({
    title: 'Registration Confirmed',
    preheader: `You are registered for ${targetEventName} — MSC PRPCEM`,
    content: `
      <p style="margin-top: 0; font-size: 15px; color: #1e293b;">Hello <strong>${userName}</strong>,</p>
      <p style="font-size: 15px; color: #334155; line-height: 1.6;">
        Your registration for <strong>${targetEventName}</strong> has been successfully confirmed. We look forward to seeing you at the event!
      </p>

      <!-- Registration Summary Card -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; table-layout: fixed; box-sizing: border-box;">
        <tr>
          <td style="padding: 10px 14px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; word-break: break-word;">
            Registration Details
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 2px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
              ${detailRows}
            </table>
          </td>
        </tr>
      </table>

      ${tracksHtml}

      <!-- Action Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; table-layout: fixed;">
        <tr>
          <td align="center">
            <a href="${portalUrl}" target="_blank" class="mobile-btn" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); text-align: center; max-width: 100%; box-sizing: border-box;">
              Access Student Portal &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 0; word-break: break-word;">
        Please keep this confirmation for your records. For any questions or updates, reach out to our team at
        <a href="mailto:${replyToAddr}" style="color: #2563eb; text-decoration: none; font-weight: 600; word-break: break-all;">${replyToAddr}</a>.
      </p>
    `
  });

  const plainText = `Hello ${userName},\n\nYour registration for ${targetEventName} has been confirmed!\n\nRegistration Details:\n• Event: ${targetEventName}\n• Participant: ${userName}${registrationId ? `\n• Registration ID: ${registrationId}` : ''}${college ? `\n• College: ${college}` : ''}${branch || year ? `\n• Branch/Year: ${[branch, year].filter(Boolean).join(' - ')}` : ''}${eventDate ? `\n• Date: ${eventDate}` : ''}${eventVenue ? `\n• Venue: ${eventVenue}` : ''}\n${tracksPlainText}\nAccess Portal: ${portalUrl}\n\nWe look forward to seeing you at the event!\n\n—\nMicrosoft Student Club (MSC)\nP.R. Pote (Patil) College of Engineering & Management, Amravati\nSupport: ${replyToAddr}`;

  return transport.sendMail({
    from: fromAddr,
    to: to.trim(),
    replyTo: replyToAddr,
    subject: `Registration Confirmed: ${targetEventName} — MSC PRPCEM`,
    text: plainText,
    html,
    messageId: generateMessageId(fromAddr),
    headers: {
      'X-Mailer': 'MSC-PRPCEM-QuizPlatform',
      'List-Unsubscribe': `<mailto:${replyToAddr}?subject=unsubscribe>`
    }
  });
};

/**
 * Send Custom Admin Broadcast / Notification Email
 */
const sendCustomBroadcastEmail = async ({ to, recipientName, subject, heading, messageHtml, ctaText, ctaUrl }) => {
  const transport = getTransporter();
  const userName = recipientName || (to ? to.split('@')[0] : 'Learner');
  const fromAddr = getSenderAddress();
  const replyToAddr = getReplyToAddress();

  let actionButtonHtml = '';
  if (ctaText && ctaUrl) {
    actionButtonHtml = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0; table-layout: fixed;">
        <tr>
          <td align="center">
            <a href="${ctaUrl}" target="_blank" class="mobile-btn" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); text-align: center; max-width: 100%; box-sizing: border-box;">
              ${ctaText} &rarr;
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0 0 16px 0; word-break: break-all; overflow-wrap: anywhere;">
        Link: <a href="${ctaUrl}" style="color: #2563eb; word-break: break-all; overflow-wrap: anywhere;">${ctaUrl}</a>
      </p>
    `;
  }

  // Check if messageHtml already contains an opening greeting (e.g. "Hello John,", "Dear John,", "Hi John,")
  // to avoid displaying duplicate greetings.
  const cleanContent = (messageHtml || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .trim();

  const hasLeadingGreeting = /^(hello|dear|hi|hey|greetings|welcome)\b/i.test(cleanContent);

  const greetingHtml = hasLeadingGreeting
    ? ''
    : `<p style="margin-top: 0; font-size: 15px; color: #1e293b;">Hello <strong>${userName}</strong>,</p>`;

  const greetingPlainText = hasLeadingGreeting
    ? ''
    : `Hello ${userName},\n\n`;

  const html = renderHtmlWrapper({
    title: heading || subject || 'MSC PRPCEM Announcement',
    preheader: subject,
    content: `
      ${greetingHtml}
      <div style="font-size: 15px; color: #334155; line-height: 1.7; margin: 16px 0; word-break: break-word; overflow-wrap: break-word;">
        ${messageHtml}
      </div>
      ${actionButtonHtml}
    `
  });

  const plainText = `${greetingPlainText}${messageHtml.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()}\n\n${ctaText && ctaUrl ? `${ctaText}: ${ctaUrl}\n\n` : ''}—\nMicrosoft Student Club (MSC)\nP.R. Pote (Patil) College of Engineering & Management, Amravati\nSupport: ${replyToAddr}`;

  return transport.sendMail({
    from: fromAddr,
    to: to.trim(),
    replyTo: replyToAddr,
    subject: subject || 'MSC PRPCEM Announcement',
    text: plainText,
    html,
    messageId: generateMessageId(fromAddr),
    headers: {
      'X-Mailer': 'MSC-PRPCEM-QuizPlatform',
      'List-Unsubscribe': `<mailto:${replyToAddr}?subject=unsubscribe>`
    }
  });
};

module.exports = {
  sendOtpEmail,
  sendQuizReminderEmail,
  sendEventRegistrationEmail,
  sendCustomBroadcastEmail,
  getTransporter,
  verifyEmailConfiguration
};

