import { useState, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';

const KEY = 'invoicing_invoices';

function save(invoices) {
  setItem(KEY, invoices);
}

export function useInvoices() {
  const [invoices, setInvoicesState] = useState(() => getItem(KEY, []));

  const addInvoice = useCallback((invoice) => {
    setInvoicesState(prev => {
      const next = [...prev, { ...invoice, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
      save(next);
      return next;
    });
    return invoice;
  }, []);

  const updateInvoice = useCallback((id, updates) => {
    setInvoicesState(prev => {
      const next = prev.map(inv => inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv);
      save(next);
      return next;
    });
  }, []);

  const deleteInvoice = useCallback((id) => {
    setInvoicesState(prev => {
      const next = prev.filter(inv => inv.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { invoices, addInvoice, updateInvoice, deleteInvoice };
}
