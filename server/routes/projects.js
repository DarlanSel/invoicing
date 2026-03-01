import { Router } from 'express';
import db from '../db/connection.js';
import { rowToObject, rowsToArray } from '../db/serialise.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY created_at ASC').all();
  res.json(rowsToArray(rows));
});

router.post('/', (req, res) => {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const { name, description = '', hourlyRate, currency = 'USD', color = '#f97316', isActive = true } = req.body;

  db.prepare(`
    INSERT INTO projects (id, name, description, hourly_rate, currency, color, is_active, created_at, updated_at)
    VALUES (@id, @name, @description, @hourlyRate, @currency, @color, @isActive, @createdAt, @updatedAt)
  `).run({ id, name, description, hourlyRate, currency, color, isActive: isActive ? 1 : 0, createdAt: now, updatedAt: now });

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(rowToObject(row));
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const camelToSnake = (s) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
  const allowed = ['name', 'description', 'hourly_rate', 'currency', 'color', 'is_active'];

  const updates = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(req.body)) {
    const snake = camelToSnake(k);
    if (allowed.includes(snake)) {
      updates[snake] = snake === 'is_active' ? (v ? 1 : 0) : v;
    }
  }

  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE projects SET ${setClauses} WHERE id = @id`).run({ ...updates, id });

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json(rowToObject(row));
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.status(204).end();
});

export default router;
