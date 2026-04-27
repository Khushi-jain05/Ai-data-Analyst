const express = require('express');
const router = express.Router();
const db = require('../db');

// @route POST /api/contact
// Saves contact form message to DB
router.post('/', (req, res) => {
  const { name, email, type, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const query = `INSERT INTO contact_messages (name, email, type, message) VALUES (?, ?, ?, ?)`;
  db.query(query, [name, email, type, message])
    .then(([result]) => {
      console.log(`📩 New message from ${name} (${email}) saved. ID: ${result.insertId}`);
      res.json({ message: 'Message sent successfully!', id: result.insertId });
    })
    .catch(err => {
      console.error('❌ Error saving contact message:', err.message);
      res.status(500).json({ error: 'Failed to send message' });
    });
});

module.exports = router;
