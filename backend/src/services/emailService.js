const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

// Initialize Transporter
let transporter = null;

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
  }

  // Development / Test Fallback Transporter
  return {
    sendMail: async (mailOptions) => {
      console.log('\n---------------- EMAIL SERVICE (DEV/TEST MODE) ----------------');
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`From: ${mailOptions.from || process.env.EMAIL_FROM || 'MSC Quiz Platform <no-reply@mscprpcem.tech>'}`);
      console.log('Content (Snippet):', (mailOptions.text || mailOptions.html || '').substring(0, 150) + '...');
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

const DEFAULT_FROM = process.env.EMAIL_FROM || '"Microsoft Student Club Quiz Platform" <no-reply@mscprpcem.tech>';

// Clean Modern Light Theme HTML Email Wrapper
const renderHtmlWrapper = ({ title, preheader, content }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #334155; }
    .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.05); }
    .header { padding: 32px 32px 20px 32px; border-bottom: 1px solid #f1f5f9; text-align: center; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
    .badge-logo { display: inline-block; background-color: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; font-weight: 800; font-size: 11px; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
    .title { color: #0f172a; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.3px; }
    .content { padding: 32px; font-size: 15px; line-height: 1.65; color: #334155; }
    .otp-box { background-color: #f0f7ff; border: 2px dashed #3b82f6; border-radius: 14px; padding: 20px 16px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #1d4ed8; margin: 0; }
    .otp-expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }
    .button { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 30px; border-radius: 10px; margin: 18px 0; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); text-align: center; }
    .footer { padding: 20px 32px 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; }
    .footer a { color: #2563eb; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <div class="badge-logo">Microsoft Student Club PRPCEM</div>
      <h1 class="title">${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Official communication from <strong>MSC Quiz Platform</strong> (PRPCEM Amravati).</p>
      <p style="margin: 0;">Need help? Contact <a href="mailto:mlsc@prpotepatilengg.ac.in">mlsc@prpotepatilengg.ac.in</a></p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send 6-Digit OTP Verification Email (Light Theme)
 */
const sendOtpEmail = async ({ to, name, otp, type = 'registration' }) => {
  const transport = getTransporter();
  const userName = name || to.split('@')[0];

  let subject = 'Your Verification Code — MSC Quiz Platform';
  let heading = 'Verify Your Email Address';
  let description = 'Use the 6-digit verification code below to complete your registration on the Microsoft Student Club Quiz Platform:';

  if (type === 'password_reset') {
    subject = 'Password Reset OTP — MSC Quiz Platform';
    heading = 'Reset Your Password';
    description = 'We received a request to reset your password. Enter the 6-digit verification code below to update your password:';
  } else if (type === 'login') {
    subject = 'Login Security Code — MSC Quiz Platform';
    heading = 'Your Login Code';
    description = 'Use the security verification code below to sign in to your student account:';
  }

  const html = renderHtmlWrapper({
    title: heading,
    preheader: `Your verification code is ${otp}. Valid for 15 minutes.`,
    content: `
      <p>Hello <strong>${userName}</strong>,</p>
      <p>${description}</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱️ Expires in 15 minutes • Do not share this code</div>
      </div>
      <p style="font-size: 13px; color: #64748b; margin: 0;">For your account security, this code is valid only for 15 minutes.</p>
    `
  });

  return transport.sendMail({
    from: DEFAULT_FROM,
    to,
    subject,
    text: `Hello ${userName},\n\nYour 6-digit verification code is: ${otp}\n\nThis code expires in 15 minutes.\n\n— Microsoft Student Club PRPCEM`,
    html
  });
};

/**
 * Send Scheduled Quiz Reminder Email (Light Theme)
 */
const sendQuizReminderEmail = async ({ to, name, quizTitle, eventName, startTime, directUrl, joinCode }) => {
  const transport = getTransporter();
  const userName = name || to.split('@')[0];
  const dateStr = startTime ? new Date(startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'Soon';

  const html = renderHtmlWrapper({
    title: 'Upcoming Quiz Reminder',
    preheader: `Reminder: ${quizTitle} is scheduled for ${dateStr}.`,
    content: `
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Get ready! The scheduled challenge <strong>${quizTitle}</strong> (${eventName || 'MSC Tech Challenge'}) is starting soon.</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <p style="margin: 4px 0; color: #334155;"><strong>📅 Start Time:</strong> ${dateStr} (IST)</p>
        <p style="margin: 4px 0; color: #334155;"><strong>🔑 Join Code:</strong> <code style="color:#2563eb;font-size:16px;font-weight:800;">${joinCode || 'LIVE'}</code></p>
      </div>
      <div style="text-align: center;">
        <a href="${directUrl || 'https://quiz.mscprpcem.tech'}" class="button" target="_blank">Start / Join Quiz Now</a>
      </div>
      <p style="font-size: 13px; color: #64748b; text-align: center;">Or access directly: <a href="${directUrl}" style="color:#2563eb;">${directUrl}</a></p>
    `
  });

  return transport.sendMail({
    from: DEFAULT_FROM,
    to,
    subject: `Reminder: ${quizTitle} — Starting ${dateStr}`,
    text: `Hello ${userName},\n\nYour quiz "${quizTitle}" is starting at ${dateStr}.\nJoin Code: ${joinCode}\nDirect Link: ${directUrl}\n\nGood luck!\n— Microsoft Student Club`,
    html
  });
};

/**
 * Send Custom Admin Broadcast Email (Light Theme)
 */
const sendCustomBroadcastEmail = async ({ to, recipientName, subject, heading, messageHtml, ctaText, ctaUrl }) => {
  const transport = getTransporter();
  const userName = recipientName || to.split('@')[0];

  let actionButtonHtml = '';
  if (ctaText && ctaUrl) {
    actionButtonHtml = `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${ctaUrl}" class="button" target="_blank">${ctaText}</a>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Link: <a href="${ctaUrl}" style="color:#2563eb;">${ctaUrl}</a></p>
    `;
  }

  const html = renderHtmlWrapper({
    title: heading || subject || 'MSC PRPCEM Announcement',
    preheader: subject,
    content: `
      <p>Hello <strong>${userName}</strong>,</p>
      <div style="font-size: 15px; color: #334155; line-height: 1.7; margin: 16px 0;">
        ${messageHtml}
      </div>
      ${actionButtonHtml}
    `
  });

  return transport.sendMail({
    from: DEFAULT_FROM,
    to,
    subject: subject || 'MSC PRPCEM Announcement',
    text: `Hello ${userName},\n\n${messageHtml.replace(/<[^>]+>/g, '')}\n\n${ctaText ? `${ctaText}: ${ctaUrl}\n\n` : ''}— Microsoft Student Club PRPCEM`,
    html
  });
};

module.exports = {
  sendOtpEmail,
  sendQuizReminderEmail,
  sendCustomBroadcastEmail
};
