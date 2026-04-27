const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

// @route GET /api/history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, filename, created_at FROM uploads WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', 
      [req.userId]
    );
    res.json({ history: rows });
  } catch (err) {
    console.error('❌ MySQL Error fetching history:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// @route GET /api/uploads/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM uploads WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Upload not found' });
    res.json({ upload: row });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// @route POST /api/history
router.post('/', authenticateToken, async (req, res) => {
  const { filename, data } = req.body;
  
  if (!req.userId) {
    return res.status(401).json({ error: 'Auth Error' });
  }

  if (!filename || !data) {
    return res.status(400).json({ error: 'Filename and data are required' });
  }

  try {
    const fileData = JSON.stringify(data);
    const [result] = await db.query(
      'INSERT INTO uploads (user_id, filename, file_data) VALUES (?, ?, ?)', 
      [req.userId, filename, fileData]
    );
    res.json({ id: result.insertId, filename, created_at: new Date() });
  } catch (err) {
    console.error('❌ MySQL Error saving upload:', err.message);
    res.status(500).json({ error: 'Error saving upload' });
  }
});

// @route DELETE /api/uploads/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM uploads WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
