import { Pool } from "pg"
import config from "../config"

export const pool = new Pool({
    connectionString: config.connection_string
});

export const initDB = async () => {
    try {
        // user database schema
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(30) NOT NULL,
            email VARCHAR(30) NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role VARCHAR(15) DEFAULT 'contributor',

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()

            )
            `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS issues(
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            description TEXT CHECK (LENGTH(description) >= 20) NOT NULL,
            type VARCHAR(20),
            status VARCHAR(20) DEFAULT 'open',
            reporter_id INT REFERENCES users(id),
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `)

        console.log("database had initialized successfully")
    } catch (err) {
        console.log(err)
    }
};