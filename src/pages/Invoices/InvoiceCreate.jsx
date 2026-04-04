import { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { addDays, format, parseISO } from 'date-fns';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatInvoiceNumber } from '../../utils/invoiceNumber';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function getMonthOptions() {
  const opts = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return opts;
}

function fmt(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function InvoiceCreate() {
  const navigate = useNavigate();
  const { projects, addInvoice, settings, timeEntries, refreshTimeEntries } = useOutletContext();

  const activeProjects = projects.filter(p => p.isActive);
  const monthOptions = getMonthOptions();

  const [projectId, setProjectId] = useState(activeProjects[0]?.id || '');
  const [billingYear, setBillingYear] = useState(monthOptions[1]?.year ?? new Date().getFullYear());
  const [billingMonth, setBillingMonth] = useState(monthOptions[1]?.month ?? new Date().getMonth() - 1);
  const [serviceDescription, setServiceDescription] = useState(settings.defaultServiceDescription || '');
  const [notes, setNotes] = useState('');

  const project = projects.find(p => p.id === projectId);
  const billingMonthStr = `${billingYear}-${String(billingMonth + 1).padStart(2, '0')}`;
  const hourlyRate = project ? project.hourlyRate : 0;

  // Filter unbilled time entries for the selected project + month
  const matchingEntries = useMemo(() => {
    return timeEntries
      .filter(e =>
        e.projectId === projectId &&
        e.date.startsWith(billingMonthStr) &&
        !e.invoiced
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [timeEntries, projectId, billingMonthStr]);

  const hoursWorked = matchingEntries.reduce((sum, e) => sum + e.hours, 0);
  const businessDays = matchingEntries.length;
  const subtotal = hoursWorked * hourlyRate;
  const total = subtotal;

  function handleMonthChange(e) {
    const [y, m] = e.target.value.split('-').map(Number);
    setBillingYear(y);
    setBillingMonth(m);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!project || matchingEntries.length === 0) return;

    const now = new Date();
    const dueAt = addDays(now, settings.paymentTermsDays);

    const invoice = {
      projectId: project.id,
      projectName: project.name,
      status: 'draft',
      billingMonth: billingMonthStr,
      serviceDescription: serviceDescription || `Consulting services — ${MONTHS[billingMonth]} ${billingYear}`,
      businessDays,
      hourlyRate,
      notes,
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      clientName: settings.clientName,
      clientAddress: settings.clientAddress,
      currency: project.currency,
      issuedAt: now.toISOString(),
      dueAt: dueAt.toISOString(),
      paidAt: null,
      lineItems: matchingEntries.map(entry => ({
        timeEntryId: entry.id,
        date: entry.date,
        description: entry.description,
        hours: entry.hours,
      })),
    };

    await addInvoice(invoice);
    await refreshTimeEntries();
    navigate('/invoices');
  }

  if (activeProjects.length === 0) {
    return (
      <div>
        <PageHeader title="New Invoice" />
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">You need at least one active project before creating an invoice.</p>
          <Button onClick={() => navigate('/projects')}>Go to Projects</Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="New Invoice" subtitle="Pulls unbilled time entries for the selected project and month" />
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Invoice Details</h2>
          <Select label="Project" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {activeProjects.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.currency} {p.hourlyRate}/hr</option>
            ))}
          </Select>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Billing Month</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={`${billingYear}-${billingMonth}`}
              onChange={handleMonthChange}
            >
              {monthOptions.map(({ year, month }) => (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {MONTHS[month]} {year}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Service Description"
            value={serviceDescription}
            onChange={e => setServiceDescription(e.target.value)}
            placeholder={`Consulting services — ${MONTHS[billingMonth]} ${billingYear}`}
          />
        </Card>

        {/* Time entries preview */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">
            Time Entries
            <span className="ml-2 text-sm font-normal text-gray-500">
              {matchingEntries.length} {matchingEntries.length === 1 ? 'entry' : 'entries'} found
            </span>
          </h2>
          {matchingEntries.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-sm text-gray-500">
              No unbilled time entries for {MONTHS[billingMonth]} {billingYear} on this project.
              <br />
              <span className="text-xs text-gray-400 mt-1 block">Log time entries on the Time page first.</span>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Date</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">Description</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">Hours</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {matchingEntries.map(entry => (
                    <tr key={entry.id}>
                      <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                        {format(parseISO(entry.date), 'EEE, MMM d')}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {entry.description || <span className="text-gray-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{entry.hours}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                        {fmt(entry.hours * hourlyRate, project?.currency || 'USD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-4 py-2.5 font-medium text-gray-700" colSpan={2}>Total</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900">{hoursWorked} hrs</td>
                    <td className="px-4 py-2.5 text-right font-bold text-orange-600">
                      {fmt(total, project?.currency || 'USD')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Hours</span>
              <span>{hoursWorked} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rate</span>
              <span>{project?.currency} {hourlyRate}/hr</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-base">
              <span>Total</span>
              <span className="text-orange-600">
                {project ? fmt(total, project.currency) : '—'}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Payment instructions, bank details, etc."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          <p className="text-xs text-gray-500">Invoice #{formatInvoiceNumber(settings.nextInvoiceNumber)} will be created as a draft.</p>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={matchingEntries.length === 0}>Create Invoice</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
