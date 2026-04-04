import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

function getSettingsOrError(res) {
  const settings = db.prepare('SELECT gitlab_domain, gitlab_token FROM settings WHERE id = 1').get();
  if (!settings.gitlab_domain || !settings.gitlab_token) {
    res.status(422).json({ error: 'GitLab domain and token must be configured in Settings' });
    return null;
  }
  return settings;
}

async function fetchMRTitlesForDate(domain, token, date) {
  const url = `${domain}/api/v4/merge_requests?updated_after=${date}T03:00:00Z&per_page=100`;
  const response = await fetch(url, { headers: { 'PRIVATE-TOKEN': token } });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitLab API error for ${date}: ${text}`);
  }
  const mergeRequests = await response.json();
  if (!Array.isArray(mergeRequests)) throw new Error('Unexpected response from GitLab API');

  const entryDate = new Date(date);
  const twoDaysBefore = new Date(entryDate);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

  return mergeRequests
    .filter(mr => {
      if (mr.state === 'closed') return false;
      if (new Date(mr.created_at) > entryDate) return false;
      if (mr.merged_at && new Date(mr.merged_at) < twoDaysBefore) return false;
      return true;
    })
    .map(mr => mr.title);
}

router.get('/merge-requests', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });

    const settings = getSettingsOrError(res);
    if (!settings) return;

    const domain = settings.gitlab_domain.replace(/\/+$/, '');
    const titles = await fetchMRTitlesForDate(domain, settings.gitlab_token, date);
    res.json({ titles });
  } catch (err) {
    next(err);
  }
});

router.get('/merge-requests/bulk', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to query parameters are required (YYYY-MM-DD)' });

    const settings = getSettingsOrError(res);
    if (!settings) return;

    const domain = settings.gitlab_domain.replace(/\/+$/, '');

    // Enumerate business days in range
    const start = new Date(from);
    const end = new Date(to);
    const days = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        days.push(cursor.toISOString().slice(0, 10));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const results = await Promise.all(
      days.map(async date => {
        const titles = await fetchMRTitlesForDate(domain, settings.gitlab_token, date);
        return [date, titles];
      })
    );

    res.json({ entries: Object.fromEntries(results) });
  } catch (err) {
    next(err);
  }
});

export default router;
