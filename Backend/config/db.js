import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000,
  // AWS RDS needs its CA bundle; a local MySQL runs without SSL (DB_SSL=false)
  ssl: process.env.DB_SSL === "false"
    ? undefined
    : { ca: fs.readFileSync(path.join(__dirname, "..", "global-bundle.pem")) },
});

db.on("error", (err) => {
  console.error("MySQL Pool Error:", err.code, err.message);
});

try {
  const connection = await db.getConnection();
  console.log("MySQL Pool Connected ✅");
  connection.release();
} catch (err) {
  console.error("Database Connection Failed ❌");
  console.error(err.message);
}

export default db;