import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = join(__dirname, '../../data/invoicing.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(readFileSync(SCHEMA_PATH, 'utf8'));

// Migrations — add new entries to the end; never edit existing ones.
const MIGRATIONS = [
  // 1 — baseline: initial schema applied above via schema.sql
  () => {},
  // 2 — add po_number to invoices
  () => {
    const cols = db.pragma('table_info(invoices)');
    if (!cols.some(c => c.name === 'po_number')) {
      db.exec("ALTER TABLE invoices ADD COLUMN po_number TEXT");
    }
  },
];

const version = db.pragma('user_version', { simple: true });
for (let i = version; i < MIGRATIONS.length; i++) {
  db.transaction(() => {
    MIGRATIONS[i]();
    db.pragma(`user_version = ${i + 1}`);
  })();
}

export default db;
