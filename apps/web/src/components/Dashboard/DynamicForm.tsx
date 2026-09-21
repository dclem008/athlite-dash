import type { SportTemplate } from '@athlite-dash/types';
import { useState } from 'react';

interface DynamicFormProps {
  template: SportTemplate;
  onSubmit: (payload: Record<string, any>, recordedAt: string) => Promise<void>;
}

export function DynamicForm({ template, onSubmit }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const todayString = new Date().toISOString().split('T')[0];
  const [eventDate, setEventDate] = useState<string>(todayString);

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isoDate = new Date(`${eventDate}T12:00:00Z`).toISOString();
    await onSubmit(formData, isoDate);
    setFormData({}); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-border-main pt-4">
      <div>
        <label className="block text-sm font-medium text-text-main mb-1">
          Date of Activity <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          required
          max={todayString}
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="w-full bg-background border border-border-main rounded p-2 text-text-main focus:border-primary focus:outline-none"
        />
      </div>

      {template.metric_definitions.map((metric) => (
        <div key={metric.id}>
          <label className="block text-sm font-medium text-text-main mb-1">
            {metric.name} {metric.is_required && <span className="text-red-400">*</span>}
          </label>
          {metric.type === 'enum' && metric.options ? (
            <select
              required={metric.is_required}
              className="w-full bg-background border border-border-main rounded p-2 text-text-main focus:border-primary focus:outline-none"
              value={formData[metric.key] || ''}
              onChange={(e) => handleInputChange(metric.key, e.target.value)}
            >
              <option value="">Select...</option>
              {metric.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={metric.type === 'number' ? 'number' : 'text'}
              required={metric.is_required}
              className="w-full bg-background border border-border-main rounded p-2 text-text-main focus:border-primary focus:outline-none"
              value={formData[metric.key] || ''}
              onChange={(e) => handleInputChange(
                metric.key,
                metric.type === 'number' ? Number(e.target.value) : e.target.value
              )}
            />
          )}
        </div>
      ))}
      
      <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-2 rounded mt-6 transition-colors">
        Log Workout
      </button>
    </form>
  );
}