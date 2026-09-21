import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { SUPABASE_SQL_SETUP } from '../lib/schemaSql.ts';
import { User } from '@supabase/supabase-js';

interface DatabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
}

export function DatabaseSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}: DatabaseSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'auth'>('status');
  const [copied, setCopied] = useState(false);

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          setAuthSuccess('Account created! Please check your email or proceed to sign in.');
          onUserChange(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setAuthSuccess('Successfully signed in.');
          onUserChange(data.user);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onUserChange(null);
    setAuthSuccess('Signed out.');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/30 dark:bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] bg-[#fcfcfb] dark:bg-[#1f1f23] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 sm:p-7 relative max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200/50 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">Database & Security</h3>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
              }`}
            >
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Archive'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 text-xs font-mono p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Minimal Tab selection */}
        <div className="flex items-center gap-4 border-b border-neutral-200/40 dark:border-neutral-800/80 pt-3 pb-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-1 transition-colors cursor-pointer ${
              activeTab === 'status'
                ? 'text-neutral-900 dark:text-neutral-100 font-semibold border-b border-neutral-900 dark:border-neutral-100'
                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-1 transition-colors cursor-pointer ${
              activeTab === 'sql'
                ? 'text-neutral-900 dark:text-neutral-100 font-semibold border-b border-neutral-900 dark:border-neutral-100'
                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            PostgreSQL Schema
          </button>
          {isSupabaseConfigured && (
            <button
              onClick={() => setActiveTab('auth')}
              className={`pb-1 transition-colors cursor-pointer ${
                activeTab === 'auth'
                  ? 'text-neutral-900 dark:text-neutral-100 font-semibold border-b border-neutral-900 dark:border-neutral-100'
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Owner Sign-In
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="py-4 overflow-y-auto flex-1 text-xs text-neutral-700 dark:text-neutral-300 space-y-4">
          {activeTab === 'status' && (
            <div className="space-y-4 leading-relaxed">
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm mb-1">Architecture</h4>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Oğulr connects to <strong>Supabase PostgreSQL</strong> for storing posts, enforcing Row Level Security (RLS), and powering PostgreSQL full-text search.
                </p>
              </div>

              {isSupabaseConfigured ? (
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-md">
                  <p className="text-emerald-900 dark:text-emerald-200 font-medium">✓ Supabase Client Configured</p>
                  <p className="text-emerald-700 dark:text-emerald-400 mt-1">
                    All created and edited thoughts are written directly to your cloud PostgreSQL database.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60 rounded-md space-y-2">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">How to connect your Supabase project:</p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-600 dark:text-neutral-400">
                    <li>Create a project at <code className="bg-neutral-200/70 dark:bg-neutral-700/70 px-1 py-0.5 rounded">supabase.com</code></li>
                    <li>Copy the SQL script in the <strong>PostgreSQL Schema</strong> tab into your Supabase SQL Editor</li>
                    <li>Set <code className="bg-neutral-200/70 dark:bg-neutral-700/70 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="bg-neutral-200/70 dark:bg-neutral-700/70 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in Settings</li>
                  </ol>
                  <p className="text-neutral-500 dark:text-neutral-400 text-[11px] pt-1">
                    While keys are pending, Oğulr automatically operates with local persistence so you can test all features immediately.
                  </p>
                </div>
              )}

              {currentUser && (
                <div className="pt-2 border-t border-neutral-200/50 dark:border-neutral-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">Logged in as owner:</span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{currentUser.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-[#c0392b] dark:text-[#e05345] hover:underline text-xs cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-neutral-400 text-[11px] font-mono">
                  Schema, FTS Index & RLS Policies:
                </span>
                <button
                  onClick={handleCopySql}
                  className="px-2.5 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-[11px] font-mono hover:bg-[#c0392b] dark:hover:bg-[#e05345] dark:hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? 'Copied ✓' : 'Copy SQL'}
                </button>
              </div>

              <pre className="p-3 bg-neutral-900 dark:bg-[#141416] text-neutral-100 dark:text-neutral-200 font-mono text-[11px] rounded-md overflow-x-auto leading-relaxed max-h-[300px] border border-neutral-800">
                {SUPABASE_SQL_SETUP}
              </pre>
            </div>
          )}

          {activeTab === 'auth' && isSupabaseConfigured && (
            <form onSubmit={handleAuth} className="space-y-3 max-w-sm mx-auto py-2">
              <div className="flex items-center justify-center gap-4 text-xs pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`pb-1 cursor-pointer ${authMode === 'signin' ? 'font-medium text-neutral-900 dark:text-neutral-100 border-b border-neutral-900 dark:border-neutral-100' : 'text-neutral-400 dark:text-neutral-500'}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`pb-1 cursor-pointer ${authMode === 'signup' ? 'font-medium text-neutral-900 dark:text-neutral-100 border-b border-neutral-900 dark:border-neutral-100' : 'text-neutral-400 dark:text-neutral-500'}`}
                >
                  Sign Up
                </button>
              </div>

              {authError && <p className="text-xs text-[#c0392b] dark:text-[#e05345] font-mono">{authError}</p>}
              {authSuccess && <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">{authSuccess}</p>}

              <div>
                <label className="block text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 bg-transparent dark:bg-[#18181b] text-neutral-900 dark:text-neutral-100 rounded text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 bg-transparent dark:bg-[#18181b] text-neutral-900 dark:text-neutral-100 rounded text-xs focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-400"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-xs font-medium hover:bg-[#c0392b] dark:hover:bg-[#e05345] dark:hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? 'Verifying…' : authMode === 'signup' ? 'Create Owner Account' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-neutral-200/50 dark:border-neutral-800/80 flex justify-end text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-md transition-colors font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
