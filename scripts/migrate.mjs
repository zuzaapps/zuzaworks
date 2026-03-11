import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const dbPath = path.join(projectRoot, 'data', 'zuzaworks.db');
const migrationsDir = path.join(projectRoot, 'migrations');

// Ensure data directory exists
fs.mkdirSync(path.join(projectRoot, 'data'), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT UNIQUE NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Get applied migrations
const applied = new Set(
  db.prepare('SELECT filename FROM _migrations').all().map(r => r.filename)
);

// Get migration files
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`Found ${files.length} migration files, ${applied.size} already applied`);

for (const file of files) {
  if (applied.has(file)) {
    console.log(`  [skip] ${file}`);
    continue;
  }

  console.log(`  [apply] ${file}`);
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

  try {
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    const transaction = db.transaction(() => {
      for (const stmt of statements) {
        try {
          db.exec(stmt);
        } catch (e) {
          // Ignore "table already exists" errors for idempotency
          if (!e.message.includes('already exists')) {
            console.warn(`    Warning: ${e.message}`);
          }
        }
      }
      db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
    });

    transaction();
    console.log(`    Applied successfully`);
  } catch (e) {
    console.error(`    Error applying ${file}: ${e.message}`);
  }
}

db.close();
console.log('Migrations complete!');
