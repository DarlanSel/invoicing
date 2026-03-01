import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Input, Textarea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { CURRENCIES } from '../constants/defaults';

export function Settings() {
  const { settings, saveSettings } = useOutletContext();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'nextInvoiceNumber' || name === 'paymentTermsDays' ? Number(value) : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your business and client details" />
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Your Business</h2>
          <Input label="Business Name" name="businessName" value={form.businessName} onChange={handleChange} placeholder="Acme Consulting LLC" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Business Address</label>
            <textarea
              name="businessAddress"
              value={form.businessAddress}
              onChange={handleChange}
              placeholder="123 Main St&#10;New York, NY 10001"
              rows={3}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Client</h2>
          <Input label="Client Name" name="clientName" value={form.clientName} onChange={handleChange} placeholder="Client Corp" />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Client Address</label>
            <textarea
              name="clientAddress"
              value={form.clientAddress}
              onChange={handleChange}
              placeholder="456 Client Ave&#10;San Francisco, CA 94105"
              rows={3}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Invoice Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Next Invoice Number"
              name="nextInvoiceNumber"
              type="number"
              min="1"
              value={form.nextInvoiceNumber}
              onChange={handleChange}
            />
            <Input
              label="Payment Terms (days)"
              name="paymentTermsDays"
              type="number"
              min="0"
              value={form.paymentTermsDays}
              onChange={handleChange}
            />
          </div>
          <Select label="Currency" name="currency" value={form.currency} onChange={handleChange}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Default Service Description</label>
            <input
              name="defaultServiceDescription"
              value={form.defaultServiceDescription}
              onChange={handleChange}
              placeholder="Consulting services"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-500">Pre-fills the service description when creating an invoice.</p>
          </div>
          <p className="text-xs text-gray-500">
            Use "Next Invoice Number" to migrate from Harvest — set it to your desired starting number and it will increment automatically.
          </p>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit">Save Settings</Button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        </div>
      </form>
    </div>
  );
}
