import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ProjectForm } from './ProjectForm';

export function ProjectList() {
  const { projects, addProject, updateProject, deleteProject } = useOutletContext();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  function handleSave(data) {
    if (editTarget) {
      updateProject(editTarget.id, data);
      setEditTarget(null);
    } else {
      addProject(data);
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Manage your consulting projects"
        action={<Button onClick={() => setShowForm(true)}>+ New Project</Button>}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon="◈"
          title="No projects yet"
          description="Create your first project to start generating invoices."
          action={<Button onClick={() => setShowForm(true)}>+ New Project</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <Card key={p.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="font-semibold text-gray-900">{p.name}</span>
                </div>
                <Badge color={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              {p.description && <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  {p.currency} {Number(p.hourlyRate).toLocaleString()}/hr
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setEditTarget(p); }}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(p)}>Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProjectForm
        isOpen={showForm || !!editTarget}
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteProject(deleteTarget.id)}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
      />
    </div>
  );
}
