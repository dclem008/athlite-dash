import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { 
  SportTemplate, GetTemplatesResponse, EventRecord, 
  GetAnalyticsResponse, GoalRecord, GetGoalsResponse, UserProfile 
} from '@athlite-dash/types';
import { DynamicForm } from './DynamicForm';
import { ProgressChart } from './ProgressChart';
import { SetGoal } from './SetGoal';
import { OfflineDB } from '../../utils/offlineQueue';

interface DashboardProps {
  session: Session;
  onLogout: () => Promise<void>;
}

export function Dashboard({ session, onLogout }: DashboardProps) {
  // --- STATE ---
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [athletes, setAthletes] = useState<UserProfile[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('');
  
  // NEW: Toggle state for Coaches (defaults to personal until profile loads)
  const [viewMode, setViewMode] = useState<'personal' | 'coaching'>('personal');
  
  const [templates, setTemplates] = useState<SportTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<EventRecord[]>([]);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [theme, setTheme] = useState(localStorage.getItem('athlite-theme') || 'default');

  useEffect(() => {
    if (theme === 'default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('athlite-theme', theme);
  }, [theme]);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${session.access_token}` };

    fetch('http://127.0.0.1:8080/api/v1/auth/me', { headers })
      .then(res => res.json())
      .then(res => {
        setProfile(res.data);
        if (res.data.role === 'coach') {
          setViewMode('coaching'); // Default to coaching view if they are a coach
          fetch('http://127.0.0.1:8080/api/v1/coach/athletes', { headers })
            .then(r => r.json())
            .then(r => {
              setAthletes(r.data);
              if (r.data.length > 0) setSelectedAthleteId(r.data[0].id);
            });
        }
      });

    fetch('http://127.0.0.1:8080/api/v1/templates')
      .then(res => res.json())
      .then((data: GetTemplatesResponse) => {
        setTemplates(data.data);
        if (data.data.length > 0) setSelectedTemplateId(data.data[0].id);
        setIsLoading(false);
      });
  }, [session.access_token]);

  // --- DASHBOARD DATA FETCHER ---
  const fetchDashboardData = useCallback(async (templateId: string, targetAthleteId?: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${session.access_token}` };
      const queryParam = targetAthleteId ? `?athlete_id=${targetAthleteId}` : '';
      
      const [analyticsRes, goalsRes] = await Promise.all([
        fetch(`http://127.0.0.1:8080/api/v1/analytics/${templateId}${queryParam}`, { headers }),
        fetch(`http://127.0.0.1:8080/api/v1/goals/${templateId}${queryParam}`, { headers })
      ]);

      if (analyticsRes.ok) {
        const analyticsData: GetAnalyticsResponse = await analyticsRes.json();
        setAnalyticsData(analyticsData.data);
      }
      
      if (goalsRes.ok) {
        const goalsData: GetGoalsResponse = await goalsRes.json();
        setGoals(goalsData.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, [session.access_token]);

  // Trigger fetch when inputs change
  useEffect(() => {
    if (selectedTemplateId) {
      if (viewMode === 'coaching' && !selectedAthleteId) return; // Wait for athlete to be selected
      
      // If personal view, pass undefined so backend fetches their own data
      const idToFetch = viewMode === 'coaching' ? selectedAthleteId : undefined;
      fetchDashboardData(selectedTemplateId, idToFetch);
    }
  }, [selectedTemplateId, selectedAthleteId, viewMode, fetchDashboardData]);

  // --- BACKGROUND SYNC ENGINE ---
  useEffect(() => {
    const syncOfflineData = async () => {
      // 1. Get all pending items from IndexedDB
      const pendingItems = await OfflineDB.getQueue();
      if (pendingItems.length === 0) return;

      console.log(`Syncing ${pendingItems.length} offline items...`);

      // 2. Loop through and send them to the backend
      for (const item of pendingItems) {
        try {
          const route = item.type === 'event' ? '/api/v1/events' : '/api/v1/goals';
          const response = await fetch(`http://127.0.0.1:8080${route}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify(item.payload),
          });

          if (response.ok) {
            // 3. If successful, remove it from the local database
            await OfflineDB.removeFromQueue(item.id!);
          }
        } catch (error) {
          console.error('Sync failed for item, will retry later', error);
          break; // Stop syncing if we hit another network error
        }
      }

      // 4. Refresh the dashboard graph to show the newly synced data
      if (selectedTemplateId) fetchDashboardData(selectedTemplateId);
      if (pendingItems.length > 0) alert('Offline data successfully synced to the cloud!');
    };

    // Run the sync instantly if they log in and are already online
    if (navigator.onLine) syncOfflineData();

    // Listen for the browser's native 'online' event to trigger sync automatically
    window.addEventListener('online', syncOfflineData);
    
    return () => {
      window.removeEventListener('online', syncOfflineData);
    };
  }, [session.access_token, selectedTemplateId, fetchDashboardData]);

  // --- OFFLINE-AWARE FORM HANDLERS ---
  const handleWorkoutSubmit = async (payload: Record<string, any>, recordedAt: string) => {
    const eventPayload = { template_id: selectedTemplateId, type: 'game', recorded_at: recordedAt, payload };

    // 1. IF OFFLINE: Save to local browser database
    if (!navigator.onLine) {
      await OfflineDB.addToQueue('event', eventPayload);
      alert('You are offline. Workout saved locally and will sync when WiFi is restored!');
      return; // Stop execution here
    }

    // 2. IF ONLINE: Send directly to backend
    try {
      const response = await fetch('http://127.0.0.1:8080/api/v1/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(eventPayload),
      });
      if (!response.ok) throw new Error('Failed to save workout');
      await fetchDashboardData(selectedTemplateId);
      alert('Workout successfully saved!');
    } catch (error: any) { 
      // Fallback: If the server is unreachable despite 'navigator.onLine' being true
      await OfflineDB.addToQueue('event', eventPayload);
      alert('Server unreachable. Saved to offline queue.');
    }
  };

  const handleGoalSubmit = async (metricKey: string, targetValue: number, deadline: string) => {
    try {
      const goalPayload = { template_id: selectedTemplateId, metric_key: metricKey, target_value: targetValue, deadline };
      const response = await fetch('http://127.0.0.1:8080/api/v1/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(goalPayload),
      });
      if (!response.ok) throw new Error('Failed to save goal');
      await fetchDashboardData(selectedTemplateId);
      alert('Goal successfully created!');
    } catch (error: any) { alert(`Error: ${error.message}`); }
  };

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId);
  
  // Boolean to cleanly determine if we render forms
  const canLogData = profile?.role === 'athlete' || viewMode === 'personal';

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 text-text-main flex flex-col items-center p-8">
      
      {/* HEADER */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Athlite-Dash</h1>
          {profile && (
            <span className="text-xs uppercase tracking-widest text-text-muted mt-1 inline-block bg-surface px-2 py-1 rounded border border-border-main">
              {viewMode === 'coaching' ? 'COACH MODE' : 'ATHLETE MODE'}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-surface border border-border-main rounded p-1 text-sm text-text-muted focus:outline-none cursor-pointer">
            <option value="light">Standard Light</option>
            <option value="dark">Standard Dark</option>
            <option value="default">Neon Dark</option>
            <option value="ocean">Ocean Blue</option>
            <option value="volcano">Volcano</option>
          </select>
          <button onClick={onLogout} className="text-text-muted hover:text-text-main text-sm underline transition-colors">Log Out</button>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: CONTROLS */}
        <div className="md:col-span-1 bg-surface p-6 rounded-lg shadow-xl border border-border-main transition-colors duration-300 h-fit">
          {isLoading ? (
            <p className="text-text-muted animate-pulse">Loading...</p>
          ) : (
            <>
              {/* NEW: View Mode Toggle for Coaches */}
              {profile?.role === 'coach' && (
                <div className="mb-6 flex bg-background rounded p-1 border border-border-main">
                  <button 
                    className={`flex-1 py-1.5 text-sm rounded transition-colors ${viewMode === 'coaching' ? 'bg-primary text-background font-bold' : 'text-text-muted hover:text-text-main'}`}
                    onClick={() => setViewMode('coaching')}
                  >
                    Team View
                  </button>
                  <button 
                    className={`flex-1 py-1.5 text-sm rounded transition-colors ${viewMode === 'personal' ? 'bg-primary text-background font-bold' : 'text-text-muted hover:text-text-main'}`}
                    onClick={() => setViewMode('personal')}
                  >
                    Personal View
                  </button>
                </div>
              )}

              {/* If Coaching: Show Athlete Selector */}
              {viewMode === 'coaching' && athletes.length > 0 && (
                <div className="mb-6 pb-6 border-b border-border-main">
                  <label className="block text-sm font-medium text-primary mb-2">Viewing Athlete</label>
                  <select 
                    className="w-full bg-background border border-primary rounded p-2 text-text-main focus:outline-none" 
                    value={selectedAthleteId} 
                    onChange={(e) => setSelectedAthleteId(e.target.value)}
                  >
                    {athletes.map((a) => (
                      <option key={a.id} value={a.id}>{a.first_name || 'Athlete'} {a.last_name || a.id.substring(0,6)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Activity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-muted mb-2">Select Activity</label>
                <select className="w-full bg-background border border-border-main rounded p-2 text-text-main focus:border-primary focus:outline-none" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                  {templates.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
                </select>
              </div>

              {/* Dynamic Forms (Only show if in Athlete Mode or Personal View) */}
              {canLogData && activeTemplate ? (
                <>
                  <DynamicForm template={activeTemplate} onSubmit={handleWorkoutSubmit} />
                  <SetGoal template={activeTemplate} onSubmit={handleGoalSubmit} />
                </>
              ) : (
                <p className="text-sm text-text-muted italic mt-4 text-center border-t border-border-main pt-6">
                  You are in Team View. You can view analytics but cannot log workouts for athletes.
                </p>
              )}
            </>
          )}
        </div>

        {/* RIGHT PANEL: VISUALIZATION */}
        <div className="md:col-span-2">
          {activeTemplate && <ProgressChart template={activeTemplate} events={analyticsData} goals={goals} />}
        </div>
      </div>
    </div>
  );
}