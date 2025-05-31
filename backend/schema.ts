// schema.ts

import mysql from 'mysql2/promise';

(async () => {
    try {
        const pool = await mysql.createPool({
            host: process.env.DB_HOST || 'conference-db',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'conference',
        });

        // Create 'person' table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS person (
                person_id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(50) NOT NULL UNIQUE,
                passwordHash VARCHAR(250) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create 'data' table with foreign key to 'person'
        await pool.query(`
            CREATE TABLE IF NOT EXISTS data (
                                                data_id INT AUTO_INCREMENT PRIMARY KEY,
                                                name VARCHAR(50) NOT NULL,
                                                value VARCHAR(500) NOT NULL,
                                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                                person_id INT,
                                                FOREIGN KEY (person_id) REFERENCES person(person_id)
                                                    ON DELETE CASCADE
                                                    ON UPDATE CASCADE
            )
        `);

        console.log('Schema initialized.');
        await pool.end();
    } catch (err: any) {
        console.error('Error: schema initialization failed:', err.message);
        process.exit(1);
    }
})();
