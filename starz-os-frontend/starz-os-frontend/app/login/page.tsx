'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const STARZ_LOGO = 'https://szguizvpiiuiyugrjeks.supabase.co/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Rico.png';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:3000/reset-password',
      });
      if (error) { setError(error.message); } else { setResetSent(true); }
    } catch { setError('Failed to send reset email.'); }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-bg-cyan flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-white">STARZ-OS</h1>
              <p className="text-xs text-white/30">Operations Platform</p>
            </div>
          </div>
          <p className="text-white/40 text-sm">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {forgotMode ? (
            <form onSubmit={handleReset} className="space-y-5">
              {resetSent ? (
                <div className="text-center py-4">
                  <p className="text-green-400 text-sm font-medium">Reset email sent!</p>
                  <p className="text-white/40 text-xs mt-1">Check your inbox for a reset link.</p>
                  <button type="button" onClick={() => { setForgotMode(false); setResetSent(false); }} className="mt-4 text-cyan-400 text-xs hover:text-cyan-300">Back to login</button>
                </div>
              ) : (
                <>
                  <p className="text-white/60 text-sm">Enter your email and we'll send a reset link.</p>
                  {error && (<div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>)}
                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Email address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@traffikboosters.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-500/50 transition-colors" />
                  </div>
                  <button type="submit" disabled={resetLoading} className="w-full gradient-bg-cyan text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {resetLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => { setForgotMode(false); setError(''); }} className="w-full text-white/30 text-xs hover:text-white/50 transition-colors">Back to login</button>
                </>
              )}
            </form>
          ) : (
          <form onSubmit={handleLogin} className="space-y-5">

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="text-xs text-white/40 mb-2 block">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@traffikboosters.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/20 outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-2">
              <button type="button" onClick={() => { setForgotMode(true); setError(''); }} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-bg-cyan text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in to STARZ-OS'
              )}
            </button>

          </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20 mt-6">
          Traffik Boosters © 2026 · STARZ-OS v2.0
        </p>

      </div>
    </div>
  );
}