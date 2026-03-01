# Invoicing

A Harvest-inspired invoicing web app for consultants. Runs entirely in the browser — no backend, no account, all data stored in `localStorage`.

## Features

- **Projects** — track clients with hourly rates and currencies
- **Auto hours calculation** — counts business days (Mon–Fri) in a billing month and multiplies by 8h
- **Invoice creation** — select a project and billing month; hours and total are calculated automatically
- **PDF download** — generates real vector PDFs (text is selectable and copyable)
- **Status tracking** — draft → sent → paid workflow with badge indicators
- **Harvest migration** — configurable starting invoice number so you can pick up where Harvest left off
- **Persistent** — all data survives page refreshes via `localStorage`

## Tech stack

|            |                     |
| ---------- | ------------------- |
| UI         | React 18 + Vite 6   |
| Styling    | Tailwind CSS v3     |
| Routing    | React Router v6     |
| Date logic | date-fns            |
| PDF        | @react-pdf/renderer |

## Getting started

Requires Node v23+. If you use nvm: `nvm use`

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## First-time setup

1. **Settings** — enter your business name/address and client name/address. Set _Next Invoice Number_ if migrating from Harvest (e.g. `101`).
2. **Projects** — create a project with an hourly rate and currency.
3. **New Invoice** — pick a project and billing month. Business days × 8h are auto-filled; override hours if needed.
4. **Invoice Detail** — preview the invoice, click **Download PDF**, then mark it Sent/Paid as the engagement progresses.

## Project structure

```
src/
  constants/defaults.js       — default values, color palettes
  utils/
    storage.js                — localStorage read/write wrappers
    businessDays.js           — countBusinessDays, calculateBillableHours
    invoiceNumber.js          — formatInvoiceNumber(n) → "INV-0042"
  hooks/
    useSettings.js            — business/client settings + nextInvoiceNumber
    useProjects.js            — project CRUD
    useInvoices.js            — invoice CRUD
  components/
    layout/Sidebar.jsx        — collapsible left nav
    layout/PageHeader.jsx     — page title + action slot
    ui/                       — Button, Input, Select, Badge, Card, Modal, …
    invoice/InvoicePreview.jsx — HTML/Tailwind invoice (screen)
    invoice/InvoicePDF.jsx     — @react-pdf/renderer Document (download)
  pages/
    Dashboard.jsx             — stats overview + recent invoices
    Projects/ProjectList.jsx  — project grid with create/edit/delete
    Invoices/InvoiceList.jsx  — table with status filter
    Invoices/InvoiceCreate.jsx — new invoice form
    Invoices/InvoiceDetail.jsx — preview + PDF download + status actions
    Settings.jsx              — business/client/invoice configuration
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```
