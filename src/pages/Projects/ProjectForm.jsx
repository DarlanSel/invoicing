import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { CURRENCIES, PROJECT_COLORS } from '../../constants/defaults';

const EMPTY = { name: '', description: '', hourlyRate: '', currency: 'USD', color: PROJECT_COLORS[0], isActive: true };

export function ProjectForm({ isOpen, onClose, onSave, initial = null }) {
  const [form, setForm] = useState(initial ? { ...initial, hourlyRate: String(initial.hourlyRate) } : EMPTY);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.hourlyRate || isNaN(Number(form.hourlyRate)) || Number(form.hourlyRate) <= 0)
      errs.hourlyRate = 'Enter a valid hourly rate';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, hourlyRate: Number(form.hourlyRate) });
    setForm(EMPTY);
    setErrors({});
    onClose();
  }

  function handleClose() {
    setForm(initial ? { ...initial, hourlyRate: String(initial.hourlyRate) } : EMPTY);
    setErrors({});
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={initial ? 'Edit Project' : 'New Project'} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Project Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="e.g. Backend Development" autoFocus />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Description (optional)</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Hourly Rate"
            name="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            value={form.hourlyRate}
            onChange={handleChange}
            error={errors.hourlyRate}
            placeholder="150"
          />
          <Select label="Currency" name="currency" value={form.currency} onChange={handleChange}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">Color</label>
          <div className="flex gap-2 flex-wrap">
            {PROJECT_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit">{initial ? 'Save Changes' : 'Create Project'}</Button>
        </div>
      </form>
    </Modal>
  );
}
