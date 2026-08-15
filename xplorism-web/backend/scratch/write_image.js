import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
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

async function writeImage() {
  try {
    const res = await pool.query("SELECT profile_photo FROM users WHERE email = 'mehtatanish2306@gmail.com';");
    if (res.rows.length > 0 && res.rows[0].profile_photo) {
      const base64Str = res.rows[0].profile_photo;
      // Extract base64 data
      const base64Data = base64Str.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(path.resolve(__dirname, 'test.jpg'), buffer);
      console.log('Successfully wrote image to scratch/test.jpg. File size:', buffer.length);
    } else {
      console.log('No profile photo found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

writeImage();
