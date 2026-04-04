import { Router } from 'express';
import db from '../db/connection.js';
import { rowToObject, rowsToArray } from '../db/serialise.js';

const router = Router();

function formatInvoiceNumber(n) {
  return `INV-${String(n).padStart(4, '0')}`;
}

function attachLineItems(invoice) {
  if (!invoice) return null;
  const obj = rowToObject(invoice);
  const items = db.prepare('SELECT * FROM invoice_line_items WHERE invoice_id = ? ORDER BY sort_order ASC, date ASC').all(invoice.id);
  obj.lineItems = rowsToArray(items);
  return obj;
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM invoices ORDER BY invoice_number_raw ASC').all();
  res.json(rows.map(r => attachLineItems(r)));
});

router.post('/', (req, res) => {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const created = db.transaction(() => {
    const settings = db.prepare('SELECT next_invoice_number FROM settings WHERE id = 1').get();
    const invoiceNumberRaw = Math.trunc(settings.next_invoice_number);
    const invoiceNumber = String(invoiceNumberRaw);

    const {
      projectId, projectName, status = 'draft', billingMonth,
      serviceDescription = '', businessDays = 0,
      hourlyRate = 0, poNumber = '', notes = '',
      businessName = '', businessAddress = '', clientName = '', clientAddress = '',
      currency = 'USD', issuedAt = null, dueAt = null, paidAt = null,
      lineItems = [],
    } = req.body;

    const hoursWorked = lineItems.reduce((sum, item) => sum + (item.hours || 0), 0);
    const subtotal = hoursWorked * hourlyRate;
    const total = subtotal;

    db.prepare(`
      INSERT INTO invoices (
        id, invoice_number, invoice_number_raw, project_id, project_name, status,
        billing_month, service_description, business_days, hours_worked, hourly_rate,
        subtotal, total, po_number, notes, business_name, business_address, client_name,
        client_address, currency, issued_at, due_at, paid_at, created_at, updated_at
      ) VALUES (
        @id, @invoiceNumber, @invoiceNumberRaw, @projectId, @projectName, @status,
        @billingMonth, @serviceDescription, @businessDays, @hoursWorked, @hourlyRate,
        @subtotal, @total, @poNumber, @notes, @businessName, @businessAddress, @clientName,
        @clientAddress, @currency, @issuedAt, @dueAt, @paidAt, @createdAt, @updatedAt
      )
    `).run({
      id, invoiceNumber, invoiceNumberRaw, projectId, projectName, status,
      billingMonth, serviceDescription, businessDays, hoursWorked, hourlyRate,
      subtotal, total, poNumber, notes, businessName, businessAddress, clientName,
      clientAddress, currency, issuedAt, dueAt, paidAt, createdAt: now, updatedAt: now,
    });

    const insertItem = db.prepare(`
      INSERT INTO invoice_line_items (id, invoice_id, time_entry_id, date, description, hours, sort_order, created_at, updated_at)
      VALUES (@id, @invoiceId, @timeEntryId, @date, @description, @hours, @sortOrder, @createdAt, @updatedAt)
    `);
    const markInvoiced = db.prepare('UPDATE time_entries SET invoiced = 1, updated_at = ? WHERE id = ?');

    lineItems.forEach((item, index) => {
      const itemId = crypto.randomUUID();
      insertItem.run({
        id: itemId,
        invoiceId: id,
        timeEntryId: item.timeEntryId || null,
        date: item.date,
        description: item.description || '',
        hours: item.hours || 0,
        sortOrder: index,
        createdAt: now,
        updatedAt: now,
      });
      if (item.timeEntryId) {
        markInvoiced.run(now, item.timeEntryId);
      }
    });

    db.prepare('UPDATE settings SET next_invoice_number = next_invoice_number + 1, updated_at = ? WHERE id = 1')
      .run(now);

    return db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  })();

  res.status(201).json(attachLineItems(created));
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const camelToSnake = (s) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
  const allowed = ['status', 'po_number', 'notes', 'service_description', 'paid_at', 'issued_at', 'due_at'];

  const updates = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(req.body)) {
    const snake = camelToSnake(k);
    if (allowed.includes(snake)) {
      updates[snake] = v;
    }
  }

  const setClauses = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE invoices SET ${setClauses} WHERE id = @id`).run({ ...updates, id });

  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  res.json(attachLineItems(row));
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.transaction(() => {
    const lineItems = db.prepare('SELECT time_entry_id FROM invoice_line_items WHERE invoice_id = ? AND time_entry_id IS NOT NULL').all(id);
    const unmark = db.prepare('UPDATE time_entries SET invoiced = 0, updated_at = ? WHERE id = ?');
    const now = new Date().toISOString();
    for (const item of lineItems) {
      unmark.run(now, item.time_entry_id);
    }
    db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  })();

  res.status(204).end();
});

export default router;
