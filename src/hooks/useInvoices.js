import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getInvoices()
      .then(setInvoices)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addInvoice = useCallback(async (invoice) => {
    const created = await api.addInvoice(invoice);
    setInvoices(prev => [...prev, created]);
    return created;
  }, []);

  const updateInvoice = useCallback(async (id, updates) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
    try {
      const updated = await api.updateInvoice(id, updates);
      setInvoices(prev => prev.map(inv => inv.id === id ? updated : inv));
    } catch (err) {
      setError(err.message);
      api.getInvoices().then(setInvoices).catch(() => {});
    }
  }, []);

  const deleteInvoice = useCallback(async (id) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    try {
      await api.deleteInvoice(id);
    } catch (err) {
      setError(err.message);
      api.getInvoices().then(setInvoices).catch(() => {});
    }
  }, []);

  return { invoices, addInvoice, updateInvoice, deleteInvoice, loading, error };
}
