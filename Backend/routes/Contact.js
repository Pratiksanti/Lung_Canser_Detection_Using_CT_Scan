const express = require('express');
const router = express.Router();
const Message = require('../models/Contact');
const auth = require('../middleware/auth'); 

router.post('/', auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const { message, sentAt } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || null;
    const userAgent = req.get('User-Agent') || null;

    const nameToSave = user.name || user.email || 'User';
    const emailToSave = user.email || '';
    const doc = await Message.create({
      user: user._id,
      name: String(nameToSave).trim(),
      email: String(emailToSave).trim().toLowerCase(),
      message: String(message).trim(),
      ip,
      userAgent,
      createdAt: sentAt ? new Date(sentAt) : new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Thanks — your message was received.',
      id: doc._id,
    });
  } catch (err) {
    console.error('Contact POST error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error saving message',
    });
  }
});

module.exports = router;
