import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getProjects()
      .then(setProjects)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addProject = useCallback(async (project) => {
    const created = await api.addProject(project);
    setProjects(prev => [...prev, created]);
    return created;
  }, []);

  const updateProject = useCallback(async (id, updates) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    try {
      const updated = await api.updateProject(id, updates);
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err) {
      setError(err.message);
      api.getProjects().then(setProjects).catch(() => {});
    }
  }, []);

  const deleteProject = useCallback(async (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    try {
      await api.deleteProject(id);
    } catch (err) {
      setError(err.message);
      api.getProjects().then(setProjects).catch(() => {});
    }
  }, []);

  return { projects, addProject, updateProject, deleteProject, loading, error };
}
