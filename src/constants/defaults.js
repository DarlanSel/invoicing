export const DEFAULT_SETTINGS = {
  businessName: '',
  businessAddress: '',
  clientName: '',
  clientAddress: '',
  nextInvoiceNumber: 1,
  currency: 'USD',
  paymentTermsDays: 14,
};

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY'];

export const INVOICE_STATUSES = ['draft', 'sent', 'paid'];

export const STATUS_COLORS = {
  draft: 'gray',
  sent: 'blue',
  paid: 'green',
};

export const PROJECT_COLORS = [
  '#f97316', '#0d9488', '#3b82f6', '#8b5cf6',
  '#ec4899', '#f59e0b', '#10b981', '#ef4444',
];
