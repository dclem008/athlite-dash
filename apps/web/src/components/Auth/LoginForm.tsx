import { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string, pass: string) => Promise<void>;
  onSignUp: (email: string, pass: string) => Promise<void>;
  isLoading: boolean;
}

export function LoginForm({ onLogin, onSignUp, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-sm border border-slate-700">
        <h1 className="text-3xl font-bold text-emerald-400 mb-6 text-center">Athlite-Dash</h1>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-emerald-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-emerald-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => onLogin(email, password)}
              disabled={isLoading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded"
            >
              Login
            </button>
            <button
              onClick={() => onSignUp(email, password)}
              disabled={isLoading}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}