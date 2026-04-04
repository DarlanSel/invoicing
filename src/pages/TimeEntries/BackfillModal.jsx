import { useState } from 'react';
import { format, subDays, parseISO, isWeekend, eachDayOfInterval } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { api } from '../../utils/api';

const today = new Date();
const defaultTo = format(today, 'yyyy-MM-dd');
const defaultFrom = format(subDays(today, 30), 'yyyy-MM-dd');

function businessDaysInRange(from, to) {
  const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) });
  return days.filter(d => !isWeekend(d)).map(d => format(d, 'yyyy-MM-dd'));
}

export function BackfillModal({ projects, timeEntries, addTimeEntry, onClose }) {
  const activeProjects = projects.filter(p => p.isActive);

  // Step 1 state
  const [projectId, setProjectId] = useState(activeProjects[0]?.id || '');
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  // Step 2 state
  const [pendingEntries, setPendingEntries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    if (!projectId || !from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const { entries: mrsByDate } = await api.fetchGitlabMRTitlesBulk(from, to);

      const existingDates = new Set(
        timeEntries
          .filter(e => e.projectId === projectId)
          .map(e => e.date)
      );

      const days = businessDaysInRange(from, to).filter(d => !existingDates.has(d));

      const generated = days.map(date => ({
        _key: date,
        date,
        hours: '8',
        description: (mrsByDate[date] || []).join('\n'),
      }));

      setPendingEntries(generated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateEntry(key, field, value) {
    setPendingEntries(prev => prev.map(e => e._key === key ? { ...e, [field]: value } : e));
  }

  function removeEntry(key) {
    setPendingEntries(prev => prev.filter(e => e._key !== key));
  }

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      for (const entry of pendingEntries) {
        await addTimeEntry({
          projectId,
          date: entry.date,
          hours: Number(entry.hours),
          description: entry.description,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isStep2 = pendingEntries !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Backfill Time Entries</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {!isStep2 ? (
            /* Step 1 — Configure */
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Project</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {activeProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-medium text-gray-500">From</label>
                  <input
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-medium text-gray-500">To</label>
                  <input
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
          ) : (
            /* Step 2 — Review */
            <div>
              <p className="text-sm text-gray-500 mb-4">
                {pendingEntries.length === 0
                  ? 'All business days in this range already have entries.'
                  : `${pendingEntries.length} business day${pendingEntries.length !== 1 ? 's' : ''} will be created. Edit or remove entries as needed.`}
              </p>
              {pendingEntries.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-3 font-medium text-gray-500 whitespace-nowrap">Date</th>
                      <th className="text-left py-2 pr-3 font-medium text-gray-500">Description</th>
                      <th className="text-right py-2 pr-3 font-medium text-gray-500 w-20">Hours</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingEntries.map(entry => (
                      <tr key={entry._key}>
                        <td className="py-2 pr-3 text-gray-700 whitespace-nowrap align-top pt-3">
                          {format(parseISO(entry.date), 'EEE, MMM d')}
                        </td>
                        <td className="py-2 pr-3">
                          <textarea
                            value={entry.description}
                            onChange={e => updateEntry(entry._key, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                          />
                        </td>
                        <td className="py-2 pr-3 align-top pt-3">
                          <input
                            type="number"
                            min="0"
                            max="24"
                            step="0.5"
                            value={entry.hours}
                            onChange={e => updateEntry(entry._key, 'hours', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="py-2 align-top pt-3">
                          <button
                            onClick={() => removeEntry(entry._key)}
                            title="Remove this entry"
                            className="text-gray-300 hover:text-red-500 transition-colors text-base leading-none"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          {isStep2 ? (
            <>
              <Button variant="outline" onClick={() => { setPendingEntries(null); setError(null); }}>
                ← Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button
                  onClick={handleConfirm}
                  disabled={saving || pendingEntries.length === 0}
                >
                  {saving ? 'Saving…' : `Save ${pendingEntries.length} entr${pendingEntries.length !== 1 ? 'ies' : 'y'}`}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={loading || !projectId || !from || !to}>
                {loading ? 'Fetching MRs…' : 'Generate Preview →'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
