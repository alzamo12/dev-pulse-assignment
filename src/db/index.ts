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
            email VARCHAR(20) NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role VARCHAR(15) DEFAULT 'contributor',

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()

            )
            `);

        console.log("database had initialized successfully")
    } catch (err) {
        console.log(err)
    }
};