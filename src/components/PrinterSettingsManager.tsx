'use client';

import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Save,
  Trash2,
  Plus,
  AlertCircle,
  Check,
  Printer,
} from 'lucide-react';
import { settingsService } from '@/services/settings';
import type { PrinterSettings } from '@/types';

interface PrinterSettingsManagerProps {
  onBack: () => void;
}

export function PrinterSettingsManager({ onBack }: PrinterSettingsManagerProps) {
  const [printers, setPrinters] = useState<PrinterSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'thermal' as 'thermal' | 'inkjet' | 'laser' | 'browser',
    portName: '/dev/ttyUSB0',
    baudRate: 9600,
    paperWidth: 'standard' as 'standard' | 'narrow',
    autoReprint: false,
    repruntOnError: false,
    copies: 1,
    margins: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    },
    isDefault: false,
    enabled: true,
  });

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      setLoading(true);
      const allPrinters = await settingsService.getAllPrinterSettings();
      setPrinters(allPrinters);
    } catch (err) {
      setError('Failed to load printers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      type: 'thermal',
      portName: '/dev/ttyUSB0',
      baudRate: 9600,
      paperWidth: 'standard',
      autoReprint: false,
      repruntOnError: false,
      copies: 1,
      margins: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
      isDefault: false,
      enabled: true,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (printer: PrinterSettings) => {
    setFormData({
      name: printer.name,
      type: (printer.type as 'thermal' | 'inkjet' | 'laser' | 'browser') || 'thermal',
      portName: printer.portName || '/dev/ttyUSB0',
      baudRate: typeof printer.baudRate === 'number' ? printer.baudRate : 9600,
      paperWidth: (printer.paperWidth as 'standard' | 'narrow') || 'standard',
      autoReprint: printer.autoReprint || false,
      repruntOnError: printer.repruntOnError || false,
      copies: typeof printer.copies === 'number' ? printer.copies : 1,
      margins: printer.margins || { top: 10, bottom: 10, left: 10, right: 10 },
      isDefault: printer.isDefault || false,
      enabled: printer.enabled ?? true,
    });
    setEditingId(printer.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      setError(null);

      if (!formData.name.trim()) {
        setError('Printer name is required');
        return;
      }

      if (editingId) {
        await settingsService.updatePrinterSettings(editingId, formData);
      } else {
        await settingsService.createPrinterSettings(formData);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setShowForm(false);
      loadPrinters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save printer');
      console.error(err);
    }
  };

  const handleDelete = async (printerId: string) => {
    if (confirm('Are you sure you want to delete this printer?')) {
      try {
        setError(null);
        await settingsService.deletePrinterSettings(printerId);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        loadPrinters();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete printer');
        console.error(err);
      }
    }
  };

  const handleSetDefault = async (printerId: string) => {
    try {
      setError(null);
      await settingsService.setDefaultPrinter(printerId);
      loadPrinters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default printer');
      console.error(err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name.startsWith('margins.')) {
      const marginKey = name.split('.')[1] as keyof typeof formData.margins;
      setFormData((prev) => ({
        ...prev,
        margins: {
          ...prev.margins,
          [marginKey]: parseInt(value, 10),
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : type === 'number'
              ? parseInt(value, 10)
              : value,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Printer Settings</h2>
            <p className="text-gray-600 mt-1">Configure and manage your printers</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Printer
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Printer settings updated successfully
        </div>
      )}

      {/* Form Container */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-3xl">
          <h3 className="font-semibold">
            {editingId ? 'Edit Printer' : 'Add New Printer'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Printer Name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Printer Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Main Dispensary Printer"
              />
            </div>

            {/* Printer Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Printer Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="thermal">Thermal</option>
                <option value="inkjet">Inkjet</option>
                <option value="laser">Laser</option>
                <option value="browser">Browser/PDF</option>
              </select>
            </div>

            {/* Paper Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paper Width (mm)
              </label>
              <input
                type="number"
                name="paperWidth"
                value={formData.paperWidth}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Port Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port Name
              </label>
              <input
                type="text"
                name="portName"
                value={formData.portName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., /dev/ttyUSB0 or COM1"
              />
            </div>

            {/* Baud Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Baud Rate
              </label>
              <select
                name="baudRate"
                value={formData.baudRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={9600}>9600</option>
                <option value={19200}>19200</option>
                <option value={38400}>38400</option>
                <option value={115200}>115200</option>
              </select>
            </div>

            {/* Copies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Copies
              </label>
              <input
                type="number"
                name="copies"
                value={formData.copies}
                onChange={handleChange}
                min="1"
                max="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Margins */}
            <div className="col-span-2 border-t pt-4">
              <h4 className="font-medium mb-3">Margins (mm)</h4>
              <div className="grid grid-cols-4 gap-3">
                {(['top', 'bottom', 'left', 'right'] as const).map((margin) => (
                  <div key={margin}>
                    <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                      {margin}
                    </label>
                    <input
                      type="number"
                      name={`margins.${margin}`}
                      value={formData.margins[margin]}
                      onChange={handleChange}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="col-span-2 border-t pt-4 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="autoReprint"
                  checked={formData.autoReprint}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Auto-reprint on success</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="repruntOnError"
                  checked={formData.repruntOnError}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Reprint on error</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={formData.enabled}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Enabled</span>
              </label>
              {!editingId && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Set as default</span>
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Printer
            </button>
          </div>
        </div>
      )}

      {/* Printers List */}
      {!showForm && printers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configured Printers</h3>
          <div className="space-y-3">
          {printers.map((printer) => (
            <div
              key={printer.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Printer className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{printer.name}</h3>
                    {printer.isDefault && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Default
                      </span>
                    )}
                    {!printer.enabled && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {printer.type.charAt(0).toUpperCase() + printer.type.slice(1)} -{' '}
                    {printer.paperWidth}mm width {printer.portName && `- ${printer.portName}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!printer.isDefault && (
                  <button
                    onClick={() => handleSetDefault(printer.id)}
                    title="Set as default"
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(printer)}
                  className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(printer.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete printer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
            </div>
        </div>
      )}

      {/* Empty State */}
      {!showForm && printers.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Printer className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No printers configured</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Printer
          </button>
        </div>
      )}
    </div>
  );
}
