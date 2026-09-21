import { useState, useEffect } from 'react';
import type { SportTemplate } from '@athlite-dash/types';

interface SetGoalProps {
  template: SportTemplate;
  onSubmit: (metricKey: string, targetValue: number, deadline: string) => Promise<void>;
}

export function SetGoal({ template, onSubmit }: SetGoalProps) {
  // Only allow users to set goals for numbers (not enums or strings)
  const numericMetrics = template.metric_definitions.filter(m => m.type === 'number');
  
  const [metricKey, setMetricKey] = useState('');
  const [targetValue, setTargetValue] = useState<number | ''>('');
  
  // Default deadline to 30 days from now
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 30);
  const [deadline, setDeadline] = useState<string>(defaultDate.toISOString().split('T')[0]);

  // Set default dropdown value on load
  useEffect(() => {
    if (numericMetrics.length > 0 && !metricKey) {
      setMetricKey(numericMetrics[0].key);
    }
  }, [numericMetrics, metricKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricKey || targetValue === '') return;
    
    // Normalize date securely
    const isoDate = new Date(`${deadline}T12:00:00Z`).toISOString();
    await onSubmit(metricKey, Number(targetValue), isoDate);
    
    // Clear input on success
    setTargetValue('');
  };

  if (numericMetrics.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-border-main pt-6 mt-6">
      <h3 className="text-lg font-bold text-primary mb-2">Set a Goal</h3>
      
      <div>
        <label className="block text-sm font-medium text-text-muted mb-1">Target Metric</label>
        <select
          required
          className="w-full bg-background border border-border-main rounded p-2 text-text-main focus:border-primary focus:outline-none"
          value={metricKey}
          onChange={(e) => setMetricKey(e.target.value)}
        >
          {numericMetrics.map((m) => (
            <option key={m.id} value={m.key}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Target Value</label>
          <input
            type="number"
            required
            placeholder="e.g. 315"
            className="w-full bg-background border border-border-main rounded p-2 text-text-main focus:border-primary focus:outline-none"
            value={targetValue}
            onChange={(e) => setTargetValue(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Deadline</label>
          <input
            type="date"
            required
            min={new Date().toISOString().split('T')[0]} // UX: Disallow goals in the past
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-background border border-border-main rounded p-2 text-text-main focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button type="submit" className="w-full bg-surface border border-primary text-primary hover:bg-primary hover:text-background font-bold py-2 rounded transition-colors">
        Save Goal
      </button>
    </form>
  );
}