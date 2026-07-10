const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');

// GET all active reminders for the logged-in user
router.get('/', async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user.id }).sort({ dueDate: 1 });
    res.status(200).json({ success: true, data: reminders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// POST a new reminder
router.post('/', async (req, res) => {
  try {
    const reminderData = { ...req.body, user: req.user.id };
    const reminder = await Reminder.create(reminderData);
    res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// PUT (Update a reminder / Mark as Paid)
router.put('/:id', async (req, res) => {
  try {
    let reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, error: 'Reminder not found' });
    
    if (reminder.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: reminder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// DELETE a reminder
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, error: 'Reminder not found' });
    
    if (reminder.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    await reminder.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;