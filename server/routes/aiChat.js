const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Conversation = require('../models/Conversation');

const router = express.Router();

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Please sign in to use the financial assistant.' });
};

const titleFromMessage = (message) => {
  const normalized = message.replace(/\s+/g, ' ').trim();
  return normalized.length > 48 ? `${normalized.slice(0, 48).trim()}…` : normalized;
};

router.use(ensureAuthenticated);

router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user._id })
      .select('title messages createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json({ conversations });
  } catch (error) {
    console.error('Unable to load conversations:', error);
    res.status(500).json({ error: 'Could not load conversations.' });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const conversation = await Conversation.create({
      userId: req.user._id,
      title: req.body.title?.trim() || 'New conversation'
    });
    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Unable to create conversation:', error);
    res.status(500).json({ error: 'Could not create a conversation.' });
  }
});

router.patch('/conversations/:id', async (req, res) => {
  const title = req.body.title?.trim();
  if (!title) return res.status(400).json({ error: 'A conversation title is required.' });

  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title },
      { new: true, runValidators: true }
    );
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Could not rename the conversation.' });
  }
});

router.delete('/conversations/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Could not delete the conversation.' });
  }
});

router.post('/chat', async (req, res) => {
  const message = req.body.message?.trim();
  if (!message) return res.status(400).json({ error: 'Please enter a message.' });
  if (message.length > 4000) return res.status(400).json({ error: 'Messages must be 4,000 characters or fewer.' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'The assistant is not configured yet.' });

  try {
    let conversation;
    if (req.body.conversationId) {
      conversation = await Conversation.findOne({ _id: req.body.conversationId, userId: req.user._id });
      if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    } else {
      conversation = new Conversation({ userId: req.user._id, title: titleFromMessage(message) });
    }

    const history = conversation.messages.slice(-10).map(({ sender, content }) =>
      `${sender === 'user' ? 'User' : 'FlowFin Assistant'}: ${content}`
    ).join('\n');

    const prompt = `You are FlowFin Assistant, a helpful financial-planning assistant. Give practical, concise educational guidance about budgeting, saving, investing, and financial literacy. Do not give personalised regulated financial advice; encourage consultation with a qualified adviser where appropriate. Use plain text only, no markdown. Keep answers to 5–7 short lines unless the user asks for more.\n\nConversation so far:\n${history || '(New conversation)'}\n\nUser: ${message}`;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();

    conversation.messages.push({ sender: 'user', content: message });
    conversation.messages.push({ sender: 'ai', content: reply });
    if (conversation.messages.length === 2 && conversation.title === 'New conversation') conversation.title = titleFromMessage(message);
    await conversation.save();

    res.json({ conversation, reply });
  } catch (error) {
    console.error('Unable to process chat message:', error);
    res.status(500).json({ error: 'The assistant could not respond. Please try again.' });
  }
});

module.exports = router;
