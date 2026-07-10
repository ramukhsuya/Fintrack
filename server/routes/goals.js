const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');

// GET all goals for logged-in user
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ targetDate: 1 });
    res.status(200).json({ success: true, data: goals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// POST a new goal
router.post('/', async (req, res) => {
  try {
    // Inject the logged-in user's ID into the goal data
    const goalData = { ...req.body, user: req.user.id };
    const goal = await Goal.create(goalData);
    
    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// PUT (Update a goal / Add money to it)
router.put('/:id', async (req, res) => {
  try {
    let goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' });
    
    // Security check
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: goal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// DELETE a goal
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' });
    
    // Security check
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    await goal.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;