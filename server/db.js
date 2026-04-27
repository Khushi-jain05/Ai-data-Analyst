const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'datanova_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Initialization logic
async function initDb() {
  try {
    // Users table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(255),
        lastName VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        userName VARCHAR(255),
        role VARCHAR(255),
        bio TEXT,
        profileImage TEXT
      )
    `);
    console.log('✔️ Users table ready (MySQL).');

    // Uploads table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS uploads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        filename VARCHAR(255),
        file_data LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);
    console.log('✔️ Uploads table ready (MySQL).');

    // Contact messages table
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        type VARCHAR(255),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✔️ Contact messages table ready (MySQL).');

  } catch (err) {
    console.error('❌ MySQL Initialization Error:', err.message);
  }
}

initDb();

module.exports = promisePool;
