'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Check, X, Bell, Save, AlertCircle } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  title: string;
  actor_type: string;
  content: string;
  is_active: boolean;
  variables: string[];
}

export default function AdminNotificationsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notifications');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (template: Template) => {
    try {
      // Optimistic update
      setTemplates(prev => 
        prev.map(t => t.id === template.id ? { ...t, is_active: !t.is_active } : t)
      );

      const res = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: template.id, is_active: !template.is_active })
      });

      if (!res.ok) {
        throw new Error('Failed to toggle status');
      }
    } catch (err: any) {
      // Revert on error
      setError('Could not update status.');
      fetchTemplates();
    }
  };

  const startEditing = (template: Template) => {
    setEditingId(template.id);
    setEditContent(template.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveTemplate = async (id: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: editContent })
      });

      if (!res.ok) throw new Error('Failed to save template');
      
      const { template: updated } = await res.json();
      
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, content: updated.content } : t));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    setEditContent(prev => prev + ' ' + variable);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Group templates by actor_type
  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.actor_type]) acc[template.actor_type] = [];
    acc[template.actor_type].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" />
            Notification Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage automated SMS alerts sent to clients, riders, and admins.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {Object.entries(groupedTemplates).map(([group, groupTemplates]) => (
        <div key={group} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 capitalize">
              {group.toLowerCase()} Notifications
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {groupTemplates.map(template => (
              <div key={template.id} className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{template.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono text-xs">Event: {template.name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={template.is_active}
                        onChange={() => toggleActive(template)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>

                {editingId === template.id ? (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl space-y-4 border border-emerald-100 dark:border-emerald-900/30">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message Template</label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-gray-100"
                        rows={4}
                      />
                    </div>
                    
                    {template.variables?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">Available Tags (Click to insert):</p>
                        <div className="flex flex-wrap gap-2">
                          {template.variables.map(variable => (
                            <button
                              key={variable}
                              onClick={() => insertVariable(variable)}
                              type="button"
                              className="px-2 py-1 text-xs font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-sm hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 transition-colors"
                            >
                              {variable}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveTemplate(template.id)}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Template
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative bg-gray-50 dark:bg-gray-800/80 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300 pr-12 whitespace-pre-wrap">{template.content}</p>
                    <button
                      onClick={() => startEditing(template)}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit template"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
