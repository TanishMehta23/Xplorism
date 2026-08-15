import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function checkUser() {
  try {
    const res = await pool.query("SELECT id, name, email, profile_photo FROM users WHERE email = 'mehtatanish2306@gmail.com';");
    if (res.rows.length === 0) {
      console.log('User not found.');
    } else {
      const user = res.rows[0];
      console.log('User found:');
      console.log('ID:', user.id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Profile Photo Type:', typeof user.profile_photo);
      console.log('Profile Photo Length:', user.profile_photo ? user.profile_photo.length : 0);
      if (user.profile_photo) {
        console.log('Profile Photo Snippet:', user.profile_photo.substring(0, 100));
        console.log('Profile Photo End Snippet:', user.profile_photo.substring(user.profile_photo.length - 50));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkUser();
