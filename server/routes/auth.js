const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

// @route POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT email FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)', 
      [firstName, lastName, email, hashedPassword]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, firstName, lastName, email, userName: '', role: '', bio: '', profileImage: '' } });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: `Database or server error: ${error.message}` });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { 
      id: user.id, 
      firstName: user.firstName, 
      lastName: user.lastName, 
      email: user.email,
      userName: user.userName || '',
      role: user.role || '',
      bio: user.bio || '',
      profileImage: user.profileImage || ''
    } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: `Database or server error: ${error.message}` });
  }
});

// @route GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await db.query('SELECT id, firstName, lastName, email, userName, role, bio, profileImage FROM users WHERE id = ?', [decoded.id]);
    const user = rows[0];

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: {
      ...user,
      userName: user.userName || '',
      role: user.role || '',
      bio: user.bio || '',
      profileImage: user.profileImage || ''
    } });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// @route POST /api/auth/google
router.post('/google', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'No access_token provided' });

  try {
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (!googleRes.ok) throw new Error('INVALID_GOOGLE_TOKEN');

    const payload = await googleRes.json();
    const { email, given_name, family_name } = payload;

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (user) {
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { 
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email,
        profileImage: user.profileImage || ''
      } });
    } else {
      const [result] = await db.query(
        'INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)', 
        [given_name || 'User', family_name || '', email, null]
      );
      
      const userId = result.insertId;
      const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { 
        id: userId, 
        firstName: given_name, 
        lastName: family_name, 
        email, 
        profileImage: '' 
      } });
    }
  } catch (error) {
    console.error('Google Auth Error:', error);
    if (error.message === 'INVALID_GOOGLE_TOKEN') {
      res.status(401).json({ error: 'Invalid Google token' });
    } else {
      res.status(500).json({ error: `Database or server error: ${error.message}` });
    }
  }
});

// ── Multer Storage Setup ─────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/profile/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, and PNG are allowed.'));
    }
  }
});

// @route POST /api/auth/upload-profile-image
router.post('/upload-profile-image', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    upload.single('image')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'Please upload a file' });

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5002';
      const imageUrl = `${backendUrl}/uploads/profile/${req.file.filename}`;

      try {
        await db.query('UPDATE users SET profileImage = ? WHERE id = ?', [imageUrl, decoded.id]);
        res.json({ message: 'Profile picture updated', imageUrl });
      } catch (dbErr) {
        res.status(500).json({ error: 'Database update failed' });
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// @route PUT /api/auth/change-password
router.put('/change-password', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const { currentPassword, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [decoded.id]);
    const user = rows[0];

    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Current password incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// @route DELETE /api/auth/delete-account
router.delete('/delete-account', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await db.query('DELETE FROM users WHERE id = ?', [decoded.id]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// @route PUT /api/auth/update
router.put('/update', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const { firstName, lastName, email, userName, role, bio } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await db.query(
      `UPDATE users SET firstName = ?, lastName = ?, email = ?, userName = ?, role = ?, bio = ? WHERE id = ?`,
      [firstName, lastName, email, userName, role, bio, decoded.id]
    );

    const [rows] = await db.query('SELECT id, firstName, lastName, email, userName, role, bio, profileImage FROM users WHERE id = ?', [decoded.id]);
    const user = rows[0];

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        ...user,
        userName: user.userName || '',
        role: user.role || '',
        bio: user.bio || '',
        profileImage: user.profileImage || ''
      }
    });

  } catch (err) {
    console.error('Update error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already in use by another account' });
    }
    res.status(500).json({ error: 'Error updating profile' });
  }
});

module.exports = router;
