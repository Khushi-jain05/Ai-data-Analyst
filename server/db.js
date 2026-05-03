const mysql = require('mysql2');
require('dotenv').config();

const dbHost = process.env.DB_HOST || 'mysql-1158b374-nst-32a2.l.aivencloud.com';
const dbPort = process.env.DB_PORT || 22031;
let dbPassword = process.env.DB_PASSWORD || '';

// Handle the common typo where 'O' (letter) is entered as '0' (zero) in the Aiven password
if (dbPassword && dbPassword.includes('Af07')) {
  dbPassword = dbPassword.replace('Af07', 'AfO7');
}

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: process.env.DB_USER || 'avnadmin',
  password: dbPassword,
  database: process.env.DB_NAME || 'defaultdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: dbHost.includes('aivencloud') ? { rejectUnauthorized: false } : undefined
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
