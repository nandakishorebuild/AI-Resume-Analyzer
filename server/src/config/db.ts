
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

pool.query("SELECT 1")
  .then(() => {
    console.log("Connected to PostgreSQL");
  })
  .catch((error: Error) => {
    console.error("PostgreSQL connection failed:", error.message);
  });

pool.on("error", (error: Error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

export default pool;
