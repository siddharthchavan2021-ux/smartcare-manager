const transporter = require('../config/mail');

/**
 * Email Service — mirrors Java EmailService.java exactly.
 */

const sendOtpEmail = async (toEmail, otp, name) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#0d1526;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <div style="padding:28px 32px;background:linear-gradient(135deg,rgba(59,158,255,0.15),rgba(139,124,248,0.1));border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="color:#e8f0fe;font-size:1.2rem;font-weight:700;">Smart<span style="color:#3b9eff;">Care</span></span>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#e8f0fe;font-size:1.3rem;font-weight:600;margin:0 0 8px;">Verify your email</h2>
          <p style="color:#8a9cc0;font-size:0.9rem;margin:0 0 28px;">Hi ${name}, use the code below to verify your SmartCare account. This code expires in <strong style="color:#f5a623;">5 minutes</strong>.</p>
          <div style="background:#172240;border:1px solid rgba(59,158,255,0.25);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
            <div style="font-size:2.4rem;font-weight:700;letter-spacing:0.25em;color:#3b9eff;font-family:'Courier New',monospace;">${otp}</div>
            <div style="color:#4f6080;font-size:0.78rem;margin-top:8px;">One-Time Password</div>
          </div>
          <p style="color:#4f6080;font-size:0.8rem;margin:0;">If you didn't create a SmartCare account, you can safely ignore this email.</p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="color:#4f6080;font-size:0.75rem;margin:0;">© 2026 SmartCare · Secure Healthcare Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"SmartCare" <${process.env.MAIL_FROM}>`,
      to: toEmail,
      subject: 'SmartCare — Your Verification Code',
      html,
    });
  } catch (err) {
    console.error(`[SmartCare] Failed to send OTP email to ${toEmail}:`, err.message);
  }
};

const sendAppointmentEmail = async (toEmail, name, subject, headline, date, timeSlot, reason, hint, accentHex) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0a0f1e;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:500px;margin:40px auto;background:#0d1526;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
        <div style="padding:24px 32px;background:linear-gradient(135deg,rgba(59,158,255,0.12),rgba(139,124,248,0.08));border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="color:#e8f0fe;font-size:1.2rem;font-weight:700;">Smart<span style="color:#3b9eff;">Care</span></span>
        </div>
        <div style="height:3px;background:${accentHex};"></div>
        <div style="padding:32px;">
          <h2 style="color:#e8f0fe;font-size:1.2rem;font-weight:600;margin:0 0 6px;">${headline}</h2>
          <p style="color:#8a9cc0;font-size:0.88rem;margin:0 0 24px;">Hi ${name},</p>
          <div style="background:#172240;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;margin-bottom:20px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#4f6080;font-size:0.8rem;width:40%;">📅 Date</td>
                <td style="padding:6px 0;color:#e8f0fe;font-size:0.88rem;font-weight:500;">${date}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#4f6080;font-size:0.8rem;">🕐 Time</td>
                <td style="padding:6px 0;color:#e8f0fe;font-size:0.88rem;font-weight:500;">${timeSlot}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#4f6080;font-size:0.8rem;">📋 Reason</td>
                <td style="padding:6px 0;color:#e8f0fe;font-size:0.88rem;">${reason || '—'}</td>
              </tr>
            </table>
          </div>
          <p style="color:#8a9cc0;font-size:0.82rem;margin:0;padding:12px 16px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid ${accentHex};">${hint}</p>
        </div>
        <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="color:#4f6080;font-size:0.72rem;margin:0;">© 2026 SmartCare · Secure Healthcare Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"SmartCare" <${process.env.MAIL_FROM}>`,
      to: toEmail,
      subject: `SmartCare — ${subject}`,
      html,
    });
  } catch (err) {
    console.error(`[SmartCare] Failed to send appointment email to ${toEmail}:`, err.message);
  }
};

module.exports = { sendOtpEmail, sendAppointmentEmail };
