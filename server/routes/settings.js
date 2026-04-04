import { Router } from 'express';
import db from '../db/connection.js';
import { rowToObject } from '../db/serialise.js';

const router = Router();

router.get('/', (req, res) => {
  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(rowToObject(row));
});

router.patch('/', (req, res) => {
  const allowed = [
    'business_name', 'business_address', 'client_name', 'client_address',
    'next_invoice_number', 'currency', 'payment_terms_days', 'default_service_description',
    'gitlab_domain', 'gitlab_token',
  ];

  const camelToSnake = (s) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);

  const updates = {};
  for (const [k, v] of Object.entries(req.body)) {
    const snake = camelToSnake(k);
    if (allowed.includes(snake)) {
      updates[snake] = v;
    }
  }

  if (Object.keys(updates).length === 0) {
    const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    return res.json(rowToObject(row));
  }

  updates.updated_at = new Date().toISOString();
  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE settings SET ${setClauses} WHERE id = 1`).run(updates);

  const row = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(rowToObject(row));
});

export default router;
