import nodemailer from 'nodemailer';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!to) return;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@agrifop.rw',
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err: any) {
    logger.warn(`Email send failed (${to}): ${err.message}`);
  }
}

export async function sendApplicationDecisionEmail(
  to: string,
  name: string,
  status: 'approved' | 'rejected',
  feedback: string,
): Promise<void> {
  const approved = status === 'approved';
  const subject = approved ? 'Application Approved' : 'Application Rejected';
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#2d6a4f">AgriSubsidy System — AGRIFOP</h2>
      <p>Dear ${name},</p>
      <p>Your registration has been <strong>${approved ? 'approved' : 'rejected'}</strong>.</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 8px;font-weight:600">Feedback:</p>
        <p style="margin:0">${feedback}</p>
      </div>
      <p style="color:#6b7280;font-size:12px">Date: ${new Date().toLocaleString()}</p>
    </div>`;
  await sendEmail(to, subject, html);
}

export async function sendDistributionEmail(
  to: string,
  name: string,
  subject: string,
  message: string,
  details?: Record<string, string>,
): Promise<void> {
  const detailRows = details
    ? Object.entries(details).map(([k, v]) => `<tr><td style="padding:4px 8px;color:#6b7280">${k}</td><td style="padding:4px 8px">${v}</td></tr>`).join('')
    : '';
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#2d6a4f">AgriSubsidy System — AGRIFOP</h2>
      <p>Dear ${name},</p>
      <p>${message}</p>
      ${detailRows ? `<table style="margin:16px 0">${detailRows}</table>` : ''}
      <p style="color:#6b7280;font-size:12px">Date: ${new Date().toLocaleString()}</p>
    </div>`;
  await sendEmail(to, subject, html);
}
