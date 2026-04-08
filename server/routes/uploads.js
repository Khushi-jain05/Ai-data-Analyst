const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// @route GET /api/history
// Fetch recent history for the user
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT id, filename, created_at FROM uploads WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', 
    [req.userId], 
    (err, rows) => {
      if (err) {
        console.error('❌ SQL Error fetching history:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ history: rows });
    }
  );
});

// @route GET /api/uploads/:id
// Fetch specific upload data
router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM uploads WHERE id = ? AND user_id = ?', 
    [req.params.id, req.userId], 
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!row) return res.status(404).json({ error: 'Upload not found' });
      res.json({ upload: row });
    }
  );
});

// @route POST /api/history
// Save a new upload to history
router.post('/', authenticateToken, (req, res) => {
  const { filename, data } = req.body;
  
  if (!req.userId) {
    return res.status(401).json({ error: 'Auth Error: No user ID found in session' });
  }

  if (!filename || !data) {
    return res.status(400).json({ error: 'Filename and data are required' });
  }

  try {
    const fileData = JSON.stringify(data);
    db.run(`INSERT INTO uploads (user_id, filename, file_data) VALUES (?, ?, ?)`, 
      [req.userId, filename, fileData], 
      function(err) {
        if (err) {
          console.error('❌ SQL Error saving upload:', err.message);
          return res.status(500).json({ error: 'Error saving upload' });
        }
        res.json({ id: this.lastID, filename, created_at: new Date() });
      }
    );
  } catch (err) {
    console.error('❌ JSON Stringify Error:', err.message);
    res.status(500).json({ error: 'Data processing error' });
  }
});

// @route DELETE /api/uploads/:id
// Delete a history item
router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM uploads WHERE id = ? AND user_id = ?', 
    [req.params.id, req.userId], 
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true });
    }
  );
});

module.exports = router;
