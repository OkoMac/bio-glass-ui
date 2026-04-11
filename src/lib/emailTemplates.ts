/**
 * BION Email Templates
 * HTML templates for transactional emails sent via Supabase or backend.
 * Used for booking confirmations, reminders, receipts, and notifications.
 */

const BRAND = {
  indigo: "#6366F1",
  teal: "#0D9488",
  bg: "#0A0A0F",
  card: "#111118",
  text: "#E5E7EB",
  muted: "#9CA3AF",
  border: "rgba(255,255,255,0.06)",
};

function baseLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden">${preheader}</span>` : ""}
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg}">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${BRAND.card};border-radius:16px;border:1px solid ${BRAND.border};">
        <!-- Logo -->
        <tr><td style="padding:24px 24px 16px;text-align:center;">
          <img src="https://bionhealth.co.za/bion-logo-white-sm.png" alt="BION" width="80" style="display:inline-block" />
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:0 24px 24px;color:${BRAND.text};font-size:14px;line-height:1.6;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 24px;border-top:1px solid ${BRAND.border};text-align:center;">
          <p style="color:${BRAND.muted};font-size:11px;margin:0;">
            BION (Pty) Ltd · Pretoria, South Africa<br/>
            Commit to your health, your wellness and your beauty.<br/>
            <a href="https://bionhealth.co.za" style="color:${BRAND.teal};text-decoration:none;">bionhealth.co.za</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr><td align="center">
      <a href="${url}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,${BRAND.indigo},#8B5CF6);color:#fff;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;">${text}</a>
    </td></tr>
  </table>`;
}

/* ── Booking Confirmation ──────────────────────────── */
export function bookingConfirmationEmail(data: {
  clientName: string;
  providerName: string;
  service: string;
  date: string;
  time: string;
  price: string;
  bookingRef: string;
}): { subject: string; html: string } {
  return {
    subject: `Booking Confirmed — ${data.service} with ${data.providerName}`,
    html: baseLayout(`
      <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">Booking Confirmed!</h1>
      <p style="color:${BRAND.muted};margin:0 0 20px;">Your appointment has been booked successfully.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid ${BRAND.border};">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 4px;font-weight:600;color:#fff;">${data.providerName}</p>
          <p style="margin:0 0 12px;color:${BRAND.muted};font-size:13px;">${data.service}</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 16px 4px 0;color:${BRAND.muted};font-size:12px;">Date</td>
              <td style="padding:4px 0;color:#fff;font-size:13px;font-weight:500;">${data.date}</td>
            </tr>
            <tr>
              <td style="padding:4px 16px 4px 0;color:${BRAND.muted};font-size:12px;">Time</td>
              <td style="padding:4px 0;color:#fff;font-size:13px;font-weight:500;">${data.time}</td>
            </tr>
            <tr>
              <td style="padding:4px 16px 4px 0;color:${BRAND.muted};font-size:12px;">Price</td>
              <td style="padding:4px 0;color:${BRAND.teal};font-size:13px;font-weight:600;">${data.price}</td>
            </tr>
            <tr>
              <td style="padding:4px 16px 4px 0;color:${BRAND.muted};font-size:12px;">Ref</td>
              <td style="padding:4px 0;color:#fff;font-size:13px;font-family:monospace;">${data.bookingRef}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      ${button("View in Schedule", "https://bionhealth.co.za/schedule")}

      <p style="color:${BRAND.muted};font-size:12px;margin:16px 0 0;">
        Need to cancel? You can do so up to 24 hours before your appointment from the app.
      </p>
    `, `Booking confirmed: ${data.service} with ${data.providerName} on ${data.date}`),
  };
}

/* ── Booking Reminder (24h before) ────────────────── */
export function bookingReminderEmail(data: {
  clientName: string;
  providerName: string;
  service: string;
  date: string;
  time: string;
  location?: string;
}): { subject: string; html: string } {
  return {
    subject: `Reminder: ${data.service} tomorrow at ${data.time}`,
    html: baseLayout(`
      <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">Reminder</h1>
      <p style="color:${BRAND.muted};margin:0 0 20px;">You have an appointment tomorrow.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid ${BRAND.border};">
        <tr><td style="padding:16px;">
          <p style="margin:0 0 4px;font-weight:600;color:#fff;">${data.providerName}</p>
          <p style="margin:0 0 8px;color:${BRAND.muted};font-size:13px;">${data.service}</p>
          <p style="margin:0;color:#fff;font-size:13px;">${data.date} at ${data.time}</p>
          ${data.location ? `<p style="margin:4px 0 0;color:${BRAND.muted};font-size:12px;">${data.location}</p>` : ""}
        </td></tr>
      </table>

      ${button("View Appointment", "https://bionhealth.co.za/schedule")}
    `, `Reminder: ${data.service} with ${data.providerName} tomorrow at ${data.time}`),
  };
}

/* ── Payment Receipt ──────────────────────────────── */
export function paymentReceiptEmail(data: {
  clientName: string;
  providerName: string;
  service: string;
  servicePrice: string;
  bookingFee: string;
  totalPaid: string;
  date: string;
  transactionRef: string;
}): { subject: string; html: string } {
  return {
    subject: `Payment Receipt — ${data.totalPaid} for ${data.service}`,
    html: baseLayout(`
      <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">Payment Receipt</h1>
      <p style="color:${BRAND.muted};margin:0 0 20px;">Thank you for your payment, ${data.clientName}.</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid ${BRAND.border};">
        <tr><td style="padding:16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:${BRAND.muted};font-size:12px;">Service</td>
              <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${data.service}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:${BRAND.muted};font-size:12px;">Provider</td>
              <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${data.providerName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:${BRAND.muted};font-size:12px;">Date</td>
              <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${data.date}</td>
            </tr>
            <tr><td colspan="2" style="padding:8px 0;border-bottom:1px solid ${BRAND.border};"></td></tr>
            <tr>
              <td style="padding:6px 0;color:${BRAND.muted};font-size:12px;">Service price</td>
              <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${data.servicePrice}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:${BRAND.muted};font-size:12px;">Booking fee (5%)</td>
              <td style="padding:6px 0;color:#fff;font-size:13px;text-align:right;">${data.bookingFee}</td>
            </tr>
            <tr><td colspan="2" style="padding:8px 0;border-bottom:1px solid ${BRAND.border};"></td></tr>
            <tr>
              <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;">Total paid</td>
              <td style="padding:8px 0;color:${BRAND.teal};font-size:16px;font-weight:700;text-align:right;">${data.totalPaid}</td>
            </tr>
          </table>
          <p style="margin:12px 0 0;color:${BRAND.muted};font-size:11px;font-family:monospace;">
            Transaction: ${data.transactionRef}
          </p>
        </td></tr>
      </table>

      <p style="color:${BRAND.muted};font-size:12px;margin:16px 0 0;">
        Payment processed by Paystack. If you have any questions, contact support@bionhealth.co.za.
      </p>
    `, `Payment receipt: ${data.totalPaid} for ${data.service}`),
  };
}

/* ── Welcome Email ────────────────────────────────── */
export function welcomeEmail(data: {
  name: string;
  role: "client" | "provider" | "corporate";
}): { subject: string; html: string } {
  const roleCta = data.role === "provider"
    ? { text: "Set Up Your Profile", url: "https://bionhealth.co.za/pro/settings" }
    : data.role === "corporate"
    ? { text: "Add Your Team", url: "https://bionhealth.co.za/corporate/employees" }
    : { text: "Browse Providers", url: "https://bionhealth.co.za/directory" };

  return {
    subject: `Welcome to BION, ${data.name}!`,
    html: baseLayout(`
      <h1 style="color:#fff;font-size:22px;margin:0 0 8px;">Welcome, ${data.name}!</h1>
      <p style="color:${BRAND.muted};margin:0 0 20px;">
        You've joined BION — Africa's health, wellness, and beauty platform.
        Commit to your health, your wellness and your beauty. Commit to yourself.
      </p>

      ${data.role === "client" ? `
        <p style="color:${BRAND.text};font-size:13px;">Here's what you can do:</p>
        <ul style="color:${BRAND.text};font-size:13px;padding-left:20px;">
          <li>Browse 800+ verified providers in Pretoria</li>
          <li>Book fitness, medical, beauty, and wellness services</li>
          <li>Track your health, meals, routines, and medications</li>
          <li>Get personalised insights from B_, your AI assistant</li>
        </ul>
      ` : data.role === "provider" ? `
        <p style="color:${BRAND.text};font-size:13px;">Get started:</p>
        <ul style="color:${BRAND.text};font-size:13px;padding-left:20px;">
          <li>Complete your profile and add your services</li>
          <li>Upload verification documents for a Verified badge</li>
          <li>Set your availability and start receiving bookings</li>
          <li>Bookings are <strong>free forever</strong> — upgrade for analytics & messaging</li>
        </ul>
      ` : `
        <p style="color:${BRAND.text};font-size:13px;">Set up your team:</p>
        <ul style="color:${BRAND.text};font-size:13px;padding-left:20px;">
          <li>Add employees and distribute wellness credits</li>
          <li>Choose approved providers for your team</li>
          <li>Track team engagement and wellness metrics</li>
        </ul>
      `}

      ${button(roleCta.text, roleCta.url)}
    `, `Welcome to BION, ${data.name}!`),
  };
}
