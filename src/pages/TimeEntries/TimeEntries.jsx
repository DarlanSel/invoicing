import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO, isWithinInterval } from 'date-fns';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';

function formatDate(iso) {
  return format(parseISO(iso), 'EEE, MMM d');
}

export function TimeEntries() {
  const { projects, timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry } = useOutletContext();
  const activeProjects = projects.filter(p => p.isActive);

  // Week navigation
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  // New entry form
  const [formProjectId, setFormProjectId] = useState(activeProjects[0]?.id || '');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formHours, setFormHours] = useState('8');
  const [formDescription, setFormDescription] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editHours, setEditHours] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const weekEntries = useMemo(() => {
    return timeEntries
      .filter(e => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [timeEntries, weekStart, weekEnd]);

  const weekTotal = weekEntries.reduce((sum, e) => sum + e.hours, 0);

  async function handleAdd(e) {
    e.preventDefault();
    if (!formProjectId || !formDate || !formHours) return;
    await addTimeEntry({
      projectId: formProjectId,
      date: formDate,
      hours: Number(formHours),
      description: formDescription,
    });
    setFormDescription('');
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditHours(String(entry.hours));
    setEditDescription(entry.description);
  }

  async function saveEdit(id) {
    await updateTimeEntry(id, {
      hours: Number(editHours),
      description: editDescription,
    });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function getProjectName(projectId) {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown';
  }

  function getProjectColor(projectId) {
    const project = projects.find(p => p.id === projectId);
    return project ? project.color : '#6b7280';
  }

  return (
    <div>
      <PageHeader
        title="Time"
        subtitle={`${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`}
      />

      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Button size="sm" variant="outline" onClick={() => setWeekStart(s => subWeeks(s, 1))}>← Prev</Button>
        <Button size="sm" variant="outline" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</Button>
        <Button size="sm" variant="outline" onClick={() => setWeekStart(s => addWeeks(s, 1))}>Next →</Button>
        <span className="ml-auto text-sm font-medium text-gray-500">{weekTotal} hrs this week</span>
      </div>

      {/* Quick add form */}
      <Card className="p-5 mb-6">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Project</label>
            <select
              value={formProjectId}
              onChange={e => setFormProjectId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Date</label>
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex flex-col gap-1 w-20">
            <label className="text-xs font-medium text-gray-500">Hours</label>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={formHours}
              onChange={e => setFormHours(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-500">Description</label>
            <input
              type="text"
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="What did you work on?"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <Button type="submit">+ Add</Button>
        </form>
      </Card>

      {/* Entries table */}
      <Card>
        {weekEntries.length === 0 ? (
          <EmptyState
            icon="⏱"
            title="No entries this week"
            description="Use the form above to log your daily work."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Project</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Description</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Hours</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {weekEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-3 text-gray-700 whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getProjectColor(entry.projectId) }} />
                      {getProjectName(entry.projectId)}
                    </span>
                  </td>
                  {editingId === entry.id ? (
                    <>
                      <td className="px-5 py-2">
                        <input
                          type="text"
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          autoFocus
                        />
                      </td>
                      <td className="px-5 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={editHours}
                          onChange={e => setEditHours(e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-500 ml-auto"
                        />
                      </td>
                      <td className="px-5 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" onClick={() => saveEdit(entry.id)}>Save</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 text-gray-600">{entry.description || <span className="text-gray-300 italic">—</span>}</td>
                      <td className="px-5 py-3 text-right font-medium">{entry.hours}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!entry.invoiced && (
                            <>
                              <button
                                onClick={() => startEdit(entry)}
                                className="text-xs text-gray-400 hover:text-orange-600 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteTimeEntry(entry.id)}
                                className="text-xs text-gray-400 hover:text-red-600 font-medium"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {entry.invoiced === 1 && (
                            <span className="text-xs text-teal-600 font-medium">Invoiced</span>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-700" colSpan={3}>Week Total</td>
                <td className="px-5 py-3 text-right font-bold text-gray-900">{weekTotal}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </Card>
    </div>
  );
}
