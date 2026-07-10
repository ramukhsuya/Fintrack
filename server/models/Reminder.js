const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Utilities', 'Rent/Mortgage', 'Insurance', 'Subscription', 'Credit Card', 'Loan Payment', 'Phone/Internet', 'Education', 'Healthcare', 'Tax', 'Other']
  },
  dueDate: {
    type: Date,
    required: true
  },
  recurringType: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'none'
  },
  reminderDays: {
    type: Number,
    default: 3
  },
  notes: String,
  isPaid: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }, // Ensure our virtual calculations go to React
  toObject: { virtuals: true }
});

// Calculate exactly how many days until this bill is due
ReminderSchema.virtual('daysUntilDue').get(function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(this.dueDate);
  due.setHours(0, 0, 0, 0);
  
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Reminder', ReminderSchema);