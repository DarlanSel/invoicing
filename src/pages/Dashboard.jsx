import { Link, useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { STATUS_COLORS } from '../constants/defaults';

function StatCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </Card>
  );
}

function fmt(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function Dashboard() {
  const { invoices, projects } = useOutletContext();

  const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.total, 0);
  const paidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const draftCount = invoices.filter(i => i.status === 'draft').length;

  const recent = [...invoices]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const currency = invoices[0]?.currency || 'USD';

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your invoicing activity"
        action={<Link to="/invoices/new"><Button>+ New Invoice</Button></Link>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Invoiced" value={fmt(totalInvoiced, currency)} sub={`${invoices.length} invoices`} />
        <StatCard label="Outstanding" value={fmt(outstanding, currency)} color="text-orange-600" sub={`${invoices.filter(i => i.status !== 'paid').length} unpaid`} />
        <StatCard label="Paid" value={fmt(paidTotal, currency)} color="text-teal-600" />
        <StatCard label="Active Projects" value={projects.filter(p => p.isActive).length} sub={`${draftCount} draft invoice${draftCount !== 1 ? 's' : ''}`} />
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
          <Link to="/invoices" className="text-sm text-orange-600 hover:text-orange-700 font-medium">View all</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon="◻"
            title="No invoices yet"
            description="Create your first invoice to see it here."
            action={<Link to="/invoices/new"><Button>+ New Invoice</Button></Link>}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Invoice</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Project</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/invoices/${inv.id}`} className="font-medium text-orange-600 hover:text-orange-700">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{inv.projectName}</td>
                  <td className="px-5 py-3">
                    <Badge color={STATUS_COLORS[inv.status]}>{inv.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-medium">{fmt(inv.total, inv.currency)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {inv.issuedAt ? format(new Date(inv.issuedAt), 'MMM d, yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
