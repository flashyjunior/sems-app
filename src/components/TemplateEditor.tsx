'use client';

import { useState, useEffect } from 'react';
import { templateService, AVAILABLE_PLACEHOLDERS } from '@/services/template';
import type { PrintTemplate, TemplatePlaceholder } from '@/types';

interface TemplateEditorProps {
  onClose?: () => void;
  onSave?: (template: PrintTemplate) => void;
}

export function TemplateEditor({ onClose, onSave }: TemplateEditorProps) {
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [escposTemplate, setEscposTemplate] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const temps = await templateService.getAllTemplates();
      setTemplates(temps);
      if (temps.length > 0) {
        setSelectedTemplate(temps[0]);
        setHtmlTemplate(temps[0].htmlTemplate);
        setEscposTemplate(temps[0].escposTemplate || '');
      }
    } catch (err) {
      setError(`Failed to load templates: ${String(err)}`);
    }
  };

  const handleEditTemplate = (template: PrintTemplate) => {
    setSelectedTemplate(template);
    setHtmlTemplate(template.htmlTemplate);
    setEscposTemplate(template.escposTemplate || '');
    setTemplateName(template.name);
    setDescription(template.description || '');
    setIsEditing(true);
    setIsCreating(false);
    setActiveTab('editor');
  };

  const handleNewTemplate = () => {
    setTemplateName('');
    setDescription('');
    setHtmlTemplate('');
    setEscposTemplate('');
    setSelectedTemplate(null);
    setIsCreating(true);
    setIsEditing(false);
    setActiveTab('editor');
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isCreating) {
        const newTemplate = await templateService.createTemplate(
          templateName,
          htmlTemplate,
          escposTemplate || undefined,
          description || undefined
        );
        setTemplates([...templates, newTemplate]);
        setSelectedTemplate(newTemplate);
        onSave?.(newTemplate);
      } else if (selectedTemplate && isEditing) {
        const updated = await templateService.updateTemplate(selectedTemplate.id, {
          htmlTemplate,
          escposTemplate: escposTemplate || undefined,
          name: templateName,
          description: description || undefined,
        });
        setTemplates(templates.map((t) => (t.id === updated.id ? updated : t)));
        setSelectedTemplate(updated);
        onSave?.(updated);
      }

      setIsEditing(false);
      setIsCreating(false);
    } catch (err) {
      setError(`Failed to save template: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await templateService.deleteTemplate(selectedTemplate.id);
      setTemplates(templates.filter((t) => t.id !== selectedTemplate.id));
      setSelectedTemplate(templates.length > 1 ? templates[0] : null);
    } catch (err) {
      setError(`Failed to delete template: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    setError('');

    try {
      await templateService.setDefaultTemplate(selectedTemplate.id);
      const updated = await templateService.getAllTemplates();
      setTemplates(updated);
    } catch (err) {
      setError(`Failed to set default template: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const insertPlaceholder = (placeholder: TemplatePlaceholder) => {
    const textarea = activeTab === 'editor' 
      ? (document.getElementById('html-template') as HTMLTextAreaElement)
      : null;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue =
        htmlTemplate.substring(0, start) +
        `{{${placeholder}}}` +
        htmlTemplate.substring(end);
      setHtmlTemplate(newValue);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Print Templates</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
            >
              ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
              <button
                onClick={handleNewTemplate}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                + New Template
              </button>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsEditing(false);
                      setIsCreating(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-100 border border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    {template.isDefault && (
                      <div className="text-xs text-blue-600">Default</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-3">
            {selectedTemplate || isCreating ? (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      disabled={!isEditing && !isCreating}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={!isEditing && !isCreating}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'editor'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    HTML Template
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'preview'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Preview & Help
                  </button>
                </div>

                {activeTab === 'editor' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        HTML Template
                      </label>
                      <textarea
                        id="html-template"
                        value={htmlTemplate}
                        onChange={(e) => setHtmlTemplate(e.target.value)}
                        disabled={!isEditing && !isCreating}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-gray-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ESC/POS Template (Optional - for thermal printers)
                      </label>
                      <textarea
                        value={escposTemplate}
                        onChange={(e) => setEscposTemplate(e.target.value)}
                        disabled={!isEditing && !isCreating}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 text-gray-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Placeholders
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(AVAILABLE_PLACEHOLDERS).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => insertPlaceholder(key as TemplatePlaceholder)}
                            disabled={!isEditing && !isCreating}
                            title={label}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded font-mono text-left transition"
                          >
                            {`{{${key}}}`}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Wrap optional fields: {`{{#fieldName}}...{{/fieldName}}`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Placeholder Guide</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(AVAILABLE_PLACEHOLDERS).map(([key, label]) => (
                          <div key={key} className="bg-gray-50 p-2 rounded">
                            <div className="font-mono text-xs text-blue-600">{`{{${key}}}`}</div>
                            <div className="text-gray-700">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Conditional Sections</h3>
                      <p className="text-sm text-gray-700 mb-2">
                        Wrap optional content to hide it when the field is empty:
                      </p>
                      <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                        {`{{#patientName}}Patient: {{patientName}}{{/patientName}}`}
                      </div>
                    </div>
                  </div>
                )}

                {(isEditing || isCreating) && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSaveTemplate}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition"
                    >
                      {loading ? 'Saving...' : 'Save Template'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {!isEditing && !isCreating && selectedTemplate && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEditTemplate(selectedTemplate)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleSetDefault}
                      disabled={selectedTemplate.isDefault}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 rounded-lg font-semibold"
                    >
                      {selectedTemplate.isDefault ? 'Default' : 'Set as Default'}
                    </button>
                    <button
                      onClick={handleDeleteTemplate}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-600">Select or create a template to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


