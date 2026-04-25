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
          res.json({ token, user: { id: this.lastID, firstName, lastName, email, userName: '', role: '', bio: '', profileImage: '' } });
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
    db.get('SELECT id, firstName, lastName, email, userName, role, bio, profileImage FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });
      res.json({ user: {
        ...user,
        userName: user.userName || '',
        role: user.role || '',
        bio: user.bio || '',
        profileImage: user.profileImage || ''
      } });
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

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      if (user) {
        // User exists -> Log them in
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { 
          id: user.id, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          email: user.email,
          profileImage: user.profileImage || ''
        } });
      } else {
        // User does not exist -> Sign them up instantly (no password)
        db.run(`INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)`, 
          [given_name || 'User', family_name || '', email, null], 
          function(err) {
            if (err) return res.status(500).json({ error: 'Error creating Google user' });
            
            const token = jwt.sign({ id: this.lastID }, JWT_SECRET, { expiresIn: '7d' });
            return res.json({ token, user: { 
              id: this.lastID, 
              firstName: given_name, 
              lastName: family_name, 
              email, 
              profileImage: '' 
            } });
          }
        );
      }
    });


  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// ── Multer Storage Setup ─────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
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
router.post('/upload-profile-image', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload a file' });
      }

      const imageUrl = `http://localhost:5002/uploads/profile/${req.file.filename}`;

      db.run('UPDATE users SET profileImage = ? WHERE id = ?', [imageUrl, decoded.id], (dbErr) => {
        if (dbErr) {
          return res.status(500).json({ error: 'Database update failed' });
        }
        res.json({ message: 'Profile picture updated', imageUrl });
      });
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
    
    db.get('SELECT password FROM users WHERE id = ?', [decoded.id], async (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });
      
      // If user signed up via Google, they might not have a password
      if (user.password) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Current password incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id], (updErr) => {
        if (updErr) return res.status(500).json({ error: 'Update failed' });
        res.json({ message: 'Password updated successfully' });
      });
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// @route DELETE /api/auth/delete-account
router.delete('/delete-account', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.run('DELETE FROM users WHERE id = ?', [decoded.id], (err) => {
      if (err) return res.status(500).json({ error: 'Deletion failed' });
      res.json({ message: 'Account deleted successfully' });
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.put('/update', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const { firstName, lastName, email, userName, role, bio } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.run(
      `UPDATE users SET firstName = ?, lastName = ?, email = ?, userName = ?, role = ?, bio = ? WHERE id = ?`,
      [firstName, lastName, email, userName, role, bio, decoded.id],
      function(err) {
        if (err) {
          console.error('❌ Update error:', err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already in use by another account' });
          }
          return res.status(500).json({ error: 'Error updating profile: ' + err.message });
        }
        
        // Fetch updated user to return full data
        db.get('SELECT id, firstName, lastName, email, userName, role, bio, profileImage FROM users WHERE id = ?', [decoded.id], (getErr, user) => {
          if (getErr || !user) return res.status(500).json({ error: 'Updated but failed to fetch new data' });
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
        });
      }
    );

  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
