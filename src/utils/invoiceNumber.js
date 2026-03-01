export function formatInvoiceNumber(n) {
  return `INV-${String(n).padStart(4, '0')}`;
}
