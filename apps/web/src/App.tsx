import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Import our newly isolated components
import { LoginForm } from './components/Auth/LoginForm';
import { Dashboard } from './components/Dashboard/Dashboard';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Listen to Auth State globally
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) alert(error.message);
    else alert('Success! You may now log in.');
    setIsAuthLoading(false);
  };

  const handleLogin = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) alert(error.message);
    setIsAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Route the user to the correct component based on session state
  if (!session) {
    return (
      <LoginForm 
        onLogin={handleLogin} 
        onSignUp={handleSignUp} 
        isLoading={isAuthLoading} 
      />
    );
  }

  return (
    <Dashboard 
      session={session} 
      onLogout={handleLogout} 
    />
  );
}

export default App;