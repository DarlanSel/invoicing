import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { useSettings } from './hooks/useSettings';
import { useProjects } from './hooks/useProjects';
import { useInvoices } from './hooks/useInvoices';

export function App() {
  const { settings, saveSettings } = useSettings();
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useInvoices();

  const context = {
    settings, saveSettings,
    projects, addProject, updateProject, deleteProject,
    invoices, addInvoice, updateInvoice, deleteInvoice,
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 pl-56 transition-all duration-200">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet context={context} />
        </div>
      </main>
    </div>
  );
}
