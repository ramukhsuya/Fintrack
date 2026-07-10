const cron = require('node-cron');
const User = require('../models/User');
const Reminder = require('../models/Reminder');
const { sendBillReminder } = require('../utils/emailservice');

const isSameCalendarDay = (firstDate, secondDate) => (
  firstDate &&
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getDate() === secondDate.getDate()
);

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

async function runEmailReminderCheck() {
  console.log('Running email reminder check...');

  const reminders = await Reminder.find({ isPaid: false, emailSent: false });
  const today = startOfDay(new Date());
  let sentCount = 0;

  for (const reminder of reminders) {
    const dueDate = startOfDay(reminder.dueDate);
    const daysUntilDue = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

    // Do not send emails for overdue bills. A bill is emailed once per day from
    // its configured reminder window through its due date.
    if (daysUntilDue < 0 || daysUntilDue > reminder.reminderDays) continue;
    if (isSameCalendarDay(reminder.lastEmailSentAt, today)) continue;

    const user = await User.findById(reminder.user);
    if (!user?.email) {
      console.log(`Skipping reminder ${reminder._id}: user email is unavailable`);
      continue;
    }

    const emailSent = await sendBillReminder(user, reminder, daysUntilDue);
    if (!emailSent) continue;

    reminder.lastEmailSentAt = new Date();
    if (daysUntilDue === 0) reminder.emailSent = true;
    await reminder.save();
    sentCount += 1;
  }

  console.log(`Email reminder check completed: ${sentCount} email(s) sent`);
}

function scheduleEmailReminders() {
  const schedule = process.env.EMAIL_REMINDER_CRON || '0 8 * * *';
  const timezone = process.env.EMAIL_REMINDER_TIMEZONE || 'Asia/Kolkata';

  if (!cron.validate(schedule)) {
    console.error(`Email scheduler was not started: invalid cron schedule "${schedule}"`);
    return;
  }

  cron.schedule(schedule, () => {
    runEmailReminderCheck().catch((error) => {
      console.error('Error in email reminder scheduler:', error);
    });
  }, { timezone });

  console.log(`Email reminder scheduler started (${schedule}, ${timezone})`);
}

module.exports = { scheduleEmailReminders, runEmailReminderCheck };
