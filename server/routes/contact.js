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
  db.run(query, [name, email, type, message], function(err) {
    if (err) {
      console.error('❌ Error saving contact message:', err.message);
      return res.status(500).json({ error: 'Failed to send message' });
    }
    console.log(`📩 New message from ${name} (${email}) saved. ID: ${this.lastID}`);
    res.json({ message: 'Message sent successfully!', id: this.lastID });
  });
});

module.exports = router;
