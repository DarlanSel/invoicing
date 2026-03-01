import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { format } from 'date-fns';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { STATUS_COLORS } from '../../constants/defaults';

const STATUS_FILTERS = ['all', 'draft', 'sent', 'paid'];

export function InvoiceList() {
  const { invoices, deleteInvoice } = useOutletContext();
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = [...invoices]
    .filter(inv => statusFilter === 'all' || inv.status === statusFilter)
    .sort((a, b) => b.invoiceNumberRaw - a.invoiceNumberRaw);

  function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''} total`}
        action={<Link to="/invoices/new"><Button>+ New Invoice</Button></Link>}
      />

      <div className="flex gap-2 mb-5">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              statusFilter === s ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="◻"
          title={statusFilter === 'all' ? 'No invoices yet' : `No ${statusFilter} invoices`}
          description={statusFilter === 'all' ? 'Create your first invoice to get started.' : undefined}
          action={statusFilter === 'all' ? <Link to="/invoices/new"><Button>+ New Invoice</Button></Link> : undefined}
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Invoice</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Project</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Period</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Issued</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/invoices/${inv.id}`} className="font-medium text-orange-600 hover:text-orange-700">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{inv.projectName}</td>
                  <td className="px-5 py-3 text-gray-500">{inv.billingMonth}</td>
                  <td className="px-5 py-3">
                    <Badge color={STATUS_COLORS[inv.status]}>{inv.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(inv.total, inv.currency)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500">
                    {inv.issuedAt ? format(new Date(inv.issuedAt), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(inv)}
                      className="text-gray-400 hover:text-red-500 transition-colors text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteInvoice(deleteTarget.id)}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteTarget?.invoiceNumber}? This cannot be undone.`}
      />
    </div>
  );
}
