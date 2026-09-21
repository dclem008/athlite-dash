import type { SportTemplate, EventRecord, GoalRecord } from '@athlite-dash/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ProgressChartProps {
  template: SportTemplate;
  events: EventRecord[];
  goals: GoalRecord[]; // NEW: Injecting Goals
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

export function ProgressChart({ template, events, goals }: ProgressChartProps) {
  if (events.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-text-muted border border-border-main rounded-lg bg-background/50">
        No data logged yet for {template.name}.
      </div>
    );
  }

  const chartData = events.map((event) => {
    return {
      date: new Date(event.recorded_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
      ...event.payload,
    };
  });

  const numericMetrics = template.metric_definitions.filter(m => m.type === 'number');

  return (
    <div className="h-96 w-full mt-8 bg-background p-4 rounded-lg border border-border-main shadow-inner">
      <h3 className="text-lg font-semibold text-text-main mb-4">{template.name} Progress</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} />
          
          {/* ifOverflow="extendDomain" forces Recharts to scale the Y-Axis up so the goal line is always visible! */}
          <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} />
          
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
            itemStyle={{ color: 'var(--text-main)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {/* 1. Draw the actual logged data lines */}
          {numericMetrics.map((metric, index) => (
            <Line
              key={metric.id}
              type="monotone"
              dataKey={metric.key}
              name={metric.name}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4, fill: COLORS[index % COLORS.length], strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          ))}

          {/* 2. Dynamically draw the Goal Target Lines */}
          {goals.map((goal) => {
            const metricName = numericMetrics.find(m => m.key === goal.metric_key)?.name || goal.metric_key;
            return (
              <ReferenceLine 
                key={goal.id} 
                y={goal.target_value} 
                stroke="var(--text-muted)" 
                strokeDasharray="5 5"
                ifOverflow="extendDomain"
                label={{ 
                  position: 'top', 
                  value: `🎯 Goal: ${metricName} (${goal.target_value})`, 
                  fill: 'var(--text-muted)',
                  fontSize: 12
                }} 
              />
            );
          })}

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}