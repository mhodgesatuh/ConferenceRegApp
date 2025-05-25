// backend/index.js

// Load environment variables from .env
require('dotenv').config({ path: '../.env' });

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'db',
    database: 'conference',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});
