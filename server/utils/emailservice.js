const nodemailer = require('nodemailer');

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
};

async function sendBillReminder(user, reminder, daysUntilDue) {
  const transporter = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  if (!transporter || !from) {
    console.warn('Email reminder skipped: SMTP settings are incomplete.');
    return false;
  }

  const dueDate = new Date(reminder.dueDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const dueMessage = daysUntilDue === 0
    ? 'This bill is due today.'
    : `This bill is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}.`;
  const billTitle = escapeHtml(reminder.title);
  const amount = Number(reminder.amount).toFixed(2);

  try {
    await transporter.sendMail({
      from,
      to: user.email,
      subject: `Bill reminder: ${reminder.title} ${daysUntilDue === 0 ? 'is due today' : `is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}`,
      text: `Hello ${user.displayName || ''},\n\n${dueMessage}\n\nBill: ${reminder.title}\nAmount: $${amount}\nDue date: ${dueDate}\nCategory: ${reminder.category}${reminder.notes ? `\nNotes: ${reminder.notes}` : ''}\n\nFlowFin`,
      html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937"><h2 style="color:#1a5276">Bill reminder</h2><p>Hello ${escapeHtml(user.displayName || '')},</p><p><strong>${dueMessage}</strong></p><table style="border-collapse:collapse"><tr><td style="padding:4px 12px 4px 0"><strong>Bill</strong></td><td>${billTitle}</td></tr><tr><td style="padding:4px 12px 4px 0"><strong>Amount</strong></td><td>$${amount}</td></tr><tr><td style="padding:4px 12px 4px 0"><strong>Due date</strong></td><td>${dueDate}</td></tr><tr><td style="padding:4px 12px 4px 0"><strong>Category</strong></td><td>${escapeHtml(reminder.category)}</td></tr></table>${reminder.notes ? `<p><strong>Notes:</strong> ${escapeHtml(reminder.notes)}</p>` : ''}<p>— FlowFin</p></div>`
    });
    return true;
  } catch (error) {
    console.error(`Could not send reminder email for ${reminder._id}:`, error.message);
    return false;
  }
}

module.exports = { sendBillReminder };
