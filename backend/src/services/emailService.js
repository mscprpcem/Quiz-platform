const nodemailer = require('nodemailer');
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no" />
  <title>${title}</title>
  <style type="text/css">
    /* Base resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    /* Responsive styles */
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: 0 !important; }
      .mobile-p-20 { padding: 20px !important; }
      .mobile-title { font-size: 20px !important; line-height: 26px !important; }
      .otp-code-text { font-size: 32px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <!-- Anti-Spam Compliant Preview Text -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #f1f5f9;">
    ${preheader || title}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 24px 8px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background-color: #0f172a; padding: 26px 24px; border-bottom: 3px solid #2563eb;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color: rgba(37, 99, 235, 0.2); border: 1px solid #3b82f6; border-radius: 20px; padding: 4px 14px; color: #93c5fd; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                    Microsoft Student Club • PRPCEM
                  </td>
                </tr>
              </table>
              <h1 class="mobile-title" style="margin: 12px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 28px; letter-spacing: -0.3px;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td class="mobile-p-20" style="padding: 32px 28px; color: #334155; font-size: 15px; line-height: 1.65; background-color: #ffffff;">
              ${content}
            </td>
          </tr>

          <!-- Institutional Footer -->
          <tr>
            <td style="padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">
                P.R. Pote (Patil) College of Engineering & Management, Amravati
              </p>
              <p style="margin: 0 0 6px 0;">
                Department of Technical Events & Microsoft Student Club
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Support: <a href="mailto:mlsc@prpotepatilengg.ac.in" style="color: #2563eb; text-decoration: none; font-weight: 600;">mlsc@prpotepatilengg.ac.in</a> | Official Platform Notification
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
 * Send 6-Digit OTP Verification Email (Highly Optimized for Primary Inbox Delivery)
 */
const sendOtpEmail = async ({ to, name, otp, type = 'registration' }) => {
  const transport = getTransporter();
  const userName = name || (to ? to.split('@')[0] : 'Student');
  const fromAddr = getSenderAddress();
  const replyToAddr = getReplyToAddress();

  let subject = 'Your Verification Code — MSC Quiz Platform';
  let heading = 'Verify Your Email Address';
  let description = 'Use the 6-digit verification code below to complete your registration on the Microsoft Student Club Quiz Platform:';

  if (type === 'password_reset') {
    subject = 'Password Reset Code — MSC Quiz Platform';
    heading = 'Reset Your Password';
    description = 'We received a request to reset your password. Enter the 6-digit verification code below to update your credentials:';
  } else if (type === 'login') {
    subject = 'Your Login Security Code — MSC Quiz Platform';
    heading = 'Your Security Login Code';
    description = 'Use the security verification code below to sign in to your student account:';
  }

  const html = renderHtmlWrapper({
    title: heading,
    preheader: `Your verification code is ${otp}. Valid for 15 minutes.`,
    content: `
      <p style="margin-top: 0;">Hello <strong>${userName}</strong>,</p>
      <p>${description}</p>
      
      <!-- OTP Box -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td align="center" style="background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 22px 16px;">
            <div class="otp-code-text" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; line-height: 1;">
              ${otp}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-top: 10px; font-weight: 600;">
              ⏱️ Valid for 15 minutes • Do not share this code
            </div>
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
        If you did not request this verification code, please disregard this email or contact support at <a href="mailto:${replyToAddr}" style="color: #2563eb;">${replyToAddr}</a>.
      </p>
    `
  });

  const plainText = `Hello ${userName},\n\nYour 6-digit verification code is: ${otp}\n\nThis code is valid for 15 minutes.\nIf you did not request this code, please ignore this email.\n\n—\nMicrosoft Student Club\nP.R. Pote Patil College of Engineering & Management, Amravati\nSupport: ${replyToAddr}`;

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

  const html = renderHtmlWrapper({
    title: 'Upcoming Quiz Reminder',
    preheader: `Reminder: ${quizTitle} is scheduled for ${dateStr}.`,
    content: `
      <p style="margin-top: 0;">Hello <strong>${userName}</strong>,</p>
      <p>Get ready! The scheduled challenge <strong>${quizTitle}</strong> (${eventName || 'MSC Tech Challenge'}) is starting soon.</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
        <tr>
          <td style="padding: 16px 20px;">
            <p style="margin: 4px 0; color: #334155;"><strong>📅 Start Time:</strong> ${dateStr} (IST)</p>
            <p style="margin: 4px 0; color: #334155;"><strong>🔑 Join Code:</strong> <code style="background-color: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-size: 15px; font-weight: 700;">${joinCode || 'LIVE'}</code></p>
          </td>
        </tr>
      </table>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <a href="${directUrl || 'https://quiz.mscprpcem.tech'}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
              Start / Join Quiz Now &rarr;
            </a>
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin-bottom: 0;">
        Direct access link: <a href="${directUrl}" style="color: #2563eb; word-break: break-all;">${directUrl}</a>
      </p>
    `
  });

  const plainText = `Hello ${userName},\n\nYour quiz "${quizTitle}" is starting at ${dateStr} (IST).\nJoin Code: ${joinCode || 'LIVE'}\nDirect Link: ${directUrl}\n\nGood luck!\n\n—\nMicrosoft Student Club\nP.R. Pote Patil College of Engineering & Management, Amravati`;

  return transport.sendMail({
    from: fromAddr,
    to: to.trim(),
    replyTo: replyToAddr,
    subject: `Reminder: ${quizTitle} — Starting ${dateStr}`,
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
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
              ${ctaText} &rarr;
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0 0 16px 0;">
        Link: <a href="${ctaUrl}" style="color: #2563eb; word-break: break-all;">${ctaUrl}</a>
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
    : `<p style="margin-top: 0;">Hello <strong>${userName}</strong>,</p>`;

  const greetingPlainText = hasLeadingGreeting
    ? ''
    : `Hello ${userName},\n\n`;

  const html = renderHtmlWrapper({
    title: heading || subject || 'MSC PRPCEM Announcement',
    preheader: subject,
    content: `
      ${greetingHtml}
      <div style="font-size: 15px; color: #334155; line-height: 1.7; margin: 16px 0;">
        ${messageHtml}
      </div>
      ${actionButtonHtml}
    `
  });

  const plainText = `${greetingPlainText}${messageHtml.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()}\n\n${ctaText && ctaUrl ? `${ctaText}: ${ctaUrl}\n\n` : ''}—\nMicrosoft Student Club\nP.R. Pote Patil College of Engineering & Management, Amravati\nSupport: ${replyToAddr}`;

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
  sendCustomBroadcastEmail,
  getTransporter,
  verifyEmailConfiguration
};

