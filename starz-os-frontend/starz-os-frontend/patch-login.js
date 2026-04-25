const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\login\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add forgotPassword state after showPassword state
content = content.replace(
  "  const [showPassword, setShowPassword] = useState(false);",
  "  const [showPassword, setShowPassword] = useState(false);\n  const [forgotMode, setForgotMode] = useState(false);\n  const [resetSent, setResetSent] = useState(false);\n  const [resetLoading, setResetLoading] = useState(false);"
);

// Add handleReset function after handleLogin
content = content.replace(
  "  return (",
  `  const handleReset = async (e: React.FormEvent) => {
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

  return (`
);

// Add forgot password link after password field
content = content.replace(
  "            <button\n              type=\"submit\"",
  `            <div className="flex justify-end -mt-2">
              <button type="button" onClick={() => { setForgotMode(true); setError(''); }} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"`
);

// Replace the form with conditional forgot mode
content = content.replace(
  "        <div className=\"glass-card p-8\">\n          <form onSubmit={handleLogin} className=\"space-y-5\">",
  `        <div className="glass-card p-8">
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
          <form onSubmit={handleLogin} className="space-y-5">`
);

// Close the conditional at end of form
content = content.replace(
  "          </form>\n        </div>",
  "          </form>\n          )}\n        </div>"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');