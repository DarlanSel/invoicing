import { useState, useCallback } from 'react';
import { getItem, setItem } from '../utils/storage';

const KEY = 'invoicing_projects';

function save(projects) {
  setItem(KEY, projects);
}

export function useProjects() {
  const [projects, setProjectsState] = useState(() => getItem(KEY, []));

  const addProject = useCallback((project) => {
    setProjectsState(prev => {
      const next = [...prev, { ...project, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
      save(next);
      return next;
    });
  }, []);

  const updateProject = useCallback((id, updates) => {
    setProjectsState(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
      save(next);
      return next;
    });
  }, []);

  const deleteProject = useCallback((id) => {
    setProjectsState(prev => {
      const next = prev.filter(p => p.id !== id);
      save(next);
      return next;
    });
  }, []);

  return { projects, addProject, updateProject, deleteProject };
}
