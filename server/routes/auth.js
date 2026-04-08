const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { OAuth2Client } = require('google-auth-library');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

// @route POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  console.log('Signup attempt:', { firstName, lastName, email });

  if (!email || !password) {
    console.log('Signup failed: Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error('Database error during signup check:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        console.log('Signup failed: User already exists', email);
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      db.run(`INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)`, 
        [firstName, lastName, email, hashedPassword], 
        function(err) {
          if (err) return res.status(500).json({ error: 'Error creating user' });

          const token = jwt.sign({ id: this.lastID }, JWT_SECRET, { expiresIn: '7d' });
          res.json({ token, user: { id: this.lastID, firstName, lastName, email } });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email });

  if (!email || !password) {
    console.log('Login failed: Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('Database error during login check:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      console.log('Login failed: User not found', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } });
  });
});

// @route GET /api/auth/me
// Returns current user data if token is valid
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.get('SELECT id, firstName, lastName, email FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });
      res.json({ user });
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// @route POST /api/auth/google
// Verifies Google Access Token and logs in / signs up
router.post('/google', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'No access_token provided' });

  try {
    // Fetch user profile from google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (!googleRes.ok) {
       throw new Error('Invalid Google access token');
    }

    const payload = await googleRes.json();
    const { email, given_name, family_name } = payload;

    if (!email) return res.status(400).json({ error: 'No email found in Google profile' });

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (user) {
        // User exists -> Log them in
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } });
      } else {
        // User does not exist -> Sign them up instantly (no password)
        db.run(`INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)`, 
          [given_name || 'User', family_name || '', email, null], 
          function(err) {
            if (err) return res.status(500).json({ error: 'Error creating Google user' });
            
            const token = jwt.sign({ id: this.lastID }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ token, user: { id: this.lastID, firstName: given_name, lastName: family_name, email } });
          }
        );
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

module.exports = router;
