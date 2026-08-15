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

// Base Responsive HTML Email Wrapper
const renderHtmlWrapper = ({ title, preheader, content }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
    .container { max-width: 580px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .header { padding: 32px 32px 24px 32px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); text-align: center; }
    .badge-logo { display: inline-block; background: linear-gradient(135deg, #0078d4, #00bcf2); color: #ffffff; font-weight: 700; font-size: 14px; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .title { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; }
    .content { padding: 32px; font-size: 15px; line-height: 1.6; color: #cbd5e1; }
    .otp-box { background: rgba(0, 120, 212, 0.12); border: 2px dashed #0078d4; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; margin: 0; }
    .otp-expiry { font-size: 12px; color: #94a3b8; margin-top: 8px; }
    .button { display: inline-block; background: linear-gradient(135deg, #0078d4 0%, #0284c7 100%); color: #ffffff !important; font-weight: 600; font-size: 15px; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin: 20px 0; }
    .footer { padding: 20px 32px 28px 32px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px; color: #64748b; text-align: center; }
    .footer a { color: #38bdf8; text-decoration: none; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#0f172a;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="container">
    <div class="header">
      <div class="badge-logo">Microsoft Student Club</div>
      <h1 class="title">${title}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This message was sent from the official <strong>MSC Quiz Platform</strong> (PRPCEM Amravati).</p>
      <p>If you did not request this email, please disregard it or report to <a href="mailto:support@mscprpcem.tech">support@mscprpcem.tech</a>.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send 6-Digit OTP Verification Email
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
    description = 'We received a request to reset your password. Enter the 6-digit code below to set a new password:';
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
        <div class="otp-expiry">⏳ Expires in 15 minutes • Do not share this code with anyone</div>
      </div>
      <p style="font-size: 13px; color: #94a3b8;">For security reasons, this verification code will expire in 15 minutes.</p>
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
 * Send Scheduled Quiz Reminder Email
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
      <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 4px 0;"><strong>📅 Start Time:</strong> ${dateStr} (IST)</p>
        <p style="margin: 4px 0;"><strong>🔑 Join Code:</strong> <code style="color:#38bdf8;font-size:16px;">${joinCode || 'LIVE'}</code></p>
      </div>
      <div style="text-align: center;">
        <a href="${directUrl || 'https://quiz.mscprpcem.tech'}" class="button" target="_blank">Start / Join Quiz Now</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8; text-align: center;">Or copy this link: <a href="${directUrl}" style="color:#38bdf8;">${directUrl}</a></p>
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

module.exports = {
  sendOtpEmail,
  sendQuizReminderEmail
};
