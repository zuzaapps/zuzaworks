import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const dbPath = path.join(projectRoot, 'data', 'zuzaworks.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const seedFiles = [
  'seed.sql',
  'seed_auth_demo_users.sql',
  'seed_sample_data.sql',
  'seed_corporate_demo.sql',
  'compliance_seed_data.sql',
  'coida_compliance_checkpoints.sql',
  'intern_compliance_checkpoints.sql',
];

for (const file of seedFiles) {
  const filePath = path.join(projectRoot, file);
  if (!fs.existsSync(filePath)) {
    console.log(`  [skip] ${file} - not found`);
    continue;
  }

  console.log(`  [seed] ${file}`);
  const sql = fs.readFileSync(filePath, 'utf-8');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      db.exec(stmt);
    } catch (e) {
      // Ignore duplicate key errors for idempotent seeding
      if (!e.message.includes('UNIQUE constraint')) {
        // console.warn(`    Warning: ${e.message.substring(0, 100)}`);
      }
    }
  }
  console.log(`    Done`);
}

db.close();
console.log('Seeding complete!');
