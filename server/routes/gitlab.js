import { Router } from 'express';
import db from '../db/connection.js';

const router = Router();

router.get('/merge-requests', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });

    const settings = db.prepare('SELECT gitlab_domain, gitlab_token FROM settings WHERE id = 1').get();

    if (!settings.gitlab_domain || !settings.gitlab_token) {
      return res.status(422).json({ error: 'GitLab domain and token must be configured in Settings' });
    }

    const domain = settings.gitlab_domain.replace(/\/+$/, '');
    const url = `${domain}/api/v4/merge_requests?updated_after=${date}T03:00:00Z&per_page=100`;

    const response = await fetch(url, {
      headers: { 'PRIVATE-TOKEN': settings.gitlab_token },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `GitLab API error: ${text}` });
    }

    const mergeRequests = await response.json();

    if (!Array.isArray(mergeRequests)) {
      return res.status(502).json({ error: 'Unexpected response from GitLab API' });
    }

    const entryDate = new Date(date);
    const twoDaysBefore = new Date(entryDate);
    twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

    const titles = mergeRequests
      .filter(mr => {
        if (mr.state === 'closed') return false;
        if (new Date(mr.created_at) > entryDate) return false;
        if (mr.merged_at && new Date(mr.merged_at) < twoDaysBefore) return false;
        return true;
      })
      .map(mr => mr.title);

    res.json({ titles });
  } catch (err) {
    next(err);
  }
});

export default router;
