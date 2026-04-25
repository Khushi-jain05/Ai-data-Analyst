const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database', err.message);
  } else {
    console.log('📁 Connected to the SQLite database.');
    
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      email TEXT UNIQUE,
      password TEXT,
      userName TEXT,
      role TEXT,
      bio TEXT,
      profileImage TEXT
    )`, (err) => {
      if (err) {
        console.error('❌ Error creating users table', err.message);
      } else {
        console.log('✔️ Users table ready.');
        // Proactively add columns if they don't exist (for existing databases)
        db.run(`ALTER TABLE users ADD COLUMN userName TEXT`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN role TEXT`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN bio TEXT`, () => {});
        db.run(`ALTER TABLE users ADD COLUMN profileImage TEXT`, () => {});
      }
    });



    // Create uploads table for history
    db.run(`CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      filename TEXT,
      file_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
      if (err) {
        console.error('❌ Error creating uploads table', err.message);
      } else {
        console.log('✔️ Uploads table ready.');
      }
    });

    // Create contact_messages table
    db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      type TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('❌ Error creating contact_messages table', err.message);
      } else {
        console.log('✔️ Contact messages table ready.');
      }
    });
  }
});

module.exports = db;
