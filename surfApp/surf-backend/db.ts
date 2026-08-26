import { Pool } from "pg";

// One shared pool of DB connections for the whole backend.
// In the cloud, providers give a single DATABASE_URL connection string.
// Locally we use the individual DB_* vars from .env (match docker-compose.yml).
export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
