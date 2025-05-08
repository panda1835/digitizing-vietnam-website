// lib/db.ts
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.VNPF_DB_HOST,
  user: process.env.VNPF_DB_USER,
  password: process.env.VNPF_DB_PASSWORD,
  database: process.env.VNPF_DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
