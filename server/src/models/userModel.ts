import pool from "../config/db";

// Find a user by email.
export async function findUserByEmail(email: string) {
  const result = await pool.query(
    `SELECT id, name, email, password_hash
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0];
}

// Create a new user.
export async function createUser(
  name: string,
  email: string,
  passwordHash: string
) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email`,
    [name, email, passwordHash]
  );

  return result.rows[0];
}
