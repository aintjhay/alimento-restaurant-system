const nodemailer = require('nodemailer');

function getEmailConfig() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM, FRONTEND_URL } = process.env;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !FRONTEND_URL ||
      !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Email configuration is incomplete');
  }
  const frontend = new URL(FRONTEND_URL);
  if (!['http:', 'https:'].includes(frontend.protocol) ||
      (process.env.NODE_ENV === 'production' && frontend.protocol !== 'https:')) {
    throw new Error('Invalid frontend URL');
  }
  return { frontend, from: MAIL_FROM, transport: {
    host: SMTP_HOST, port, secure: port === 465, requireTLS: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true
  } };
}

async function sendPasswordResetEmail(email, token, config) {
  const link = new URL('/portal/reset-password', config.frontend);
  // Fragments aren't sent to web servers or included in HTTP referrers.
  link.hash = new URLSearchParams({ token }).toString();
  const transport = nodemailer.createTransport(config.transport);
  await transport.sendMail({
    from: config.from,
    to: { address: email },
    subject: 'Reset your Alimento password',
    text: `Open this link to choose a new password:\n\n${link.href}\n\nThis link expires in 15 minutes and can only be used once. If you did not request a reset, you can ignore this email.`
  });
}

module.exports = { getEmailConfig, sendPasswordResetEmail };
