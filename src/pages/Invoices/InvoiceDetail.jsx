import { useState } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { InvoicePreview } from '../../components/invoice/InvoicePreview';
import { InvoicePDF } from '../../components/invoice/InvoicePDF';
import { STATUS_COLORS } from '../../constants/defaults';

export function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, updateInvoice, deleteInvoice } = useOutletContext();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingPoNumber, setEditingPoNumber] = useState(false);
  const [poNumberDraft, setPoNumberDraft] = useState('');

  const invoice = invoices.find(inv => inv.id === id);

  if (!invoice) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Invoice not found.</p>
        <Link to="/invoices"><Button variant="outline">Back to Invoices</Button></Link>
      </div>
    );
  }

  async function handleDownload() {
    setPdfLoading(true);
    try {
      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  }

  function handleStatusChange(newStatus) {
    const updates = { status: newStatus };
    if (newStatus === 'paid' && !invoice.paidAt) updates.paidAt = new Date().toISOString();
    updateInvoice(invoice.id, updates);
  }

  return (
    <div>
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`${invoice.projectName} · ${invoice.billingMonth}`}
        action={
          <div className="flex items-center gap-2">
            <Badge color={STATUS_COLORS[invoice.status]}>{invoice.status}</Badge>
            {invoice.status === 'draft' && (
              <Button size="sm" variant="secondary" onClick={() => handleStatusChange('sent')}>
                Mark Sent
              </Button>
            )}
            {invoice.status === 'sent' && (
              <Button size="sm" variant="secondary" onClick={() => handleStatusChange('paid')}>
                Mark Paid
              </Button>
            )}
            {invoice.status === 'paid' && (
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('sent')}>
                Mark Unpaid
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={pdfLoading}
              className="min-w-[120px]"
            >
              {pdfLoading ? 'Generating…' : 'Download PDF'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowDelete(true)} className="text-red-500 hover:bg-red-50">
              Delete
            </Button>
          </div>
        }
      />

      {invoice.status === 'draft' && (
        <div className="max-w-2xl mx-auto mb-4 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm">
          <span className="text-gray-500 shrink-0">PO Number</span>
          {editingPoNumber ? (
            <>
              <input
                autoFocus
                type="text"
                value={poNumberDraft}
                onChange={e => setPoNumberDraft(e.target.value)}
                placeholder="e.g. PO-12345"
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={() => { updateInvoice(invoice.id, { poNumber: poNumberDraft }); setEditingPoNumber(false); }}
                className="text-orange-600 font-medium hover:text-orange-700"
              >Save</button>
              <button
                onClick={() => setEditingPoNumber(false)}
                className="text-gray-400 hover:text-gray-600"
              >Cancel</button>
            </>
          ) : (
            <>
              <span className="flex-1 font-medium text-gray-900">{invoice.poNumber || <span className="text-gray-400 italic">Not set</span>}</span>
              <button
                onClick={() => { setPoNumberDraft(invoice.poNumber || ''); setEditingPoNumber(true); }}
                className="text-gray-400 hover:text-orange-600 font-medium"
              >Edit</button>
            </>
          )}
        </div>
      )}

      <InvoicePreview invoice={invoice} />

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => { deleteInvoice(invoice.id); navigate('/invoices'); }}
        title="Delete Invoice"
        message={`Are you sure you want to delete ${invoice.invoiceNumber}? This cannot be undone.`}
      />
    </div>
  );
}
