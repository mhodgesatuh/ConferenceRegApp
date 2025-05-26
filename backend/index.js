// backend/index.js

require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: 'conference-db', // or 'db' if that's the container name
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'conference',
});

app.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT NOW() AS now');
        res.json({ message: 'Backend is working', now: rows[0].now });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
