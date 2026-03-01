# CLAUDE.md — Invoicing App

## Stack

- React 18 + Vite 6 + Tailwind CSS v3 + React Router v6
- date-fns for date/business-day logic
- @react-pdf/renderer for client-side PDF generation
- Node v23+ required

## Architecture

All state lives in `localStorage` — there is no backend. Three custom hooks manage state:

| Hook          | localStorage key     | Purpose                                                             |
| ------------- | -------------------- | ------------------------------------------------------------------- |
| `useSettings` | `invoicing_settings` | Business/client info, nextInvoiceNumber, currency, paymentTermsDays |
| `useProjects` | `invoicing_projects` | Array of project objects                                            |
| `useInvoices` | `invoicing_invoices` | Array of invoice snapshots                                          |

`App.jsx` initialises all three hooks and passes everything down via React Router's `useOutletContext`. Every page reads context with `const { ... } = useOutletContext()`.

## Invoice number sequencing

`settings.nextInvoiceNumber` is an integer. On invoice creation it is formatted via `formatInvoiceNumber(n)` → `"INV-0042"` and then `saveSettings({ nextInvoiceNumber: n + 1 })` is called. The raw integer is also stored on the invoice as `invoiceNumberRaw` for numeric sorting.

## Invoice data model — immutable snapshot

When an invoice is created, all sender/receiver fields (`businessName`, `businessAddress`, `clientName`, `clientAddress`) are copied from settings at that moment. This ensures PDFs remain correct even if settings are later changed.

## Business days calculation

`src/utils/businessDays.js` — `countBusinessDays(year, month)` filters all days in the month that are not Saturday or Sunday. `calculateBillableHours(year, month, hoursPerDay=8)` returns `{ businessDays, hours }`.

## PDF generation

`InvoicePDF.jsx` uses `@react-pdf/renderer` primitives (`Document`, `Page`, `View`, `Text`). Download is triggered in `InvoiceDetail.jsx`:

```js
const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `${invoice.invoiceNumber}.pdf`;
a.click();
URL.revokeObjectURL(url);
```

## Sidebar

`Sidebar.jsx` has local `collapsed` state that toggles between `w-56` and `w-16`. The main content area in `App.jsx` uses `pl-56` — if the sidebar collapse should affect layout dynamically, lift `collapsed` state to `App.jsx`.

## Colors

- Primary actions: `orange-500` (`#f97316`)
- Secondary/accent: `teal-600` (`#0d9488`)
- Sidebar background: `gray-900`

## Commands

```bash
npm run dev      # development server on :5173
npm run build    # production build → dist/
npm run preview  # serve dist/ locally
```
