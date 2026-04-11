const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\hr\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add Send Email button to staff table row
content = content.replace(
  "                        <td className=\"px-4 py-3 text-gray-400 text-xs\">{fmt(u.created_at)}</td>\n                      </tr>",
  "                        <td className=\"px-4 py-3 text-gray-400 text-xs\">{fmt(u.created_at)}</td>\n                        <td className=\"px-4 py-3\"><button onClick={() => { setEmailTarget(u); setShowEmailModal(true); }} className=\"flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-medium transition-colors\"><Mail className=\"w-3 h-3\" />Onboard</button></td>\n                      </tr>"
);

// Add email column header
content = content.replace(
  "<th className=\"px-4 py-3 text-left\">Joined</th></tr>",
  "<th className=\"px-4 py-3 text-left\">Joined</th><th className=\"px-4 py-3 text-left\">Action</th></tr>"
);

// Add state variables after existing ones
content = content.replace(
  "  const [metrics, setMetrics] = useState({ total: 0, active: 0, pending_invites: 0, open_alerts: 0 });",
  "  const [metrics, setMetrics] = useState({ total: 0, active: 0, pending_invites: 0, open_alerts: 0 });\n  const [showEmailModal, setShowEmailModal] = useState(false);\n  const [emailTarget, setEmailTarget] = useState<HRUser | null>(null);\n  const [emailLoading, setEmailLoading] = useState(false);\n  const [emailSent, setEmailSent] = useState(false);\n  const [emailError, setEmailError] = useState<string | null>(null);\n  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; html: string; text: string } | null>(null);\n  const [generating, setGenerating] = useState(false);"
);

// Add generateEmail and sendEmail functions before return
content = content.replace(
  "  const q = search.toLowerCase();",
  `  const q = search.toLowerCase();

  async function generateOnboardingEmail(user: HRUser) {
    setGenerating(true);
    setEmailError(null);
    try {
      const userRoleNames = getUserRoles(user.id).join(', ') || 'Team Member';
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are Zara, the HR Director AI at Traffik Boosters. Write professional, warm, and motivating onboarding emails. Always sign off as Zara, HR Director at Traffik Boosters. Return ONLY a JSON object with keys: subject, html, text. No markdown, no backticks.',
          messages: [{
            role: 'user',
            content: \`Write an onboarding email for a new hire named \${user.full_name || 'Team Member'} joining as \${userRoleNames} at Traffik Boosters. Their email is \${user.email}. Include: warm welcome, their role, what to expect in the first week, and next steps to get set up in STARZ-OS. Make the HTML version visually formatted with sections.\`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
      const parsed = JSON.parse(clean);
      setGeneratedEmail(parsed);
    } catch (e: any) {
      setEmailError('Failed to generate email. Please try again.');
    }
    setGenerating(false);
  }

  async function sendOnboardingEmail() {
    if (!emailTarget || !generatedEmail) return;
    setEmailLoading(true);
    setEmailError(null);
    try {
      const sb = createClient();
      const { error } = await sb.rpc('enqueue_email', {
        p_tenant: '00000000-0000-0000-0000-000000000301',
        p_recipient: emailTarget.email,
        p_subject: generatedEmail.subject,
        p_html: generatedEmail.html,
        p_text: generatedEmail.text,
      }, { schema: 'ops' });
      if (error) throw error;
      setEmailSent(true);
      // Log to HR audit
      await sb.schema('hr').from('audit_logs').insert({
        event_type: 'onboarding_email_sent',
        event_payload: { to: emailTarget.email, name: emailTarget.full_name, subject: generatedEmail.subject, sent_by: 'Zara' }
      });
    } catch (e: any) {
      setEmailError(e.message || 'Failed to send email');
    }
    setEmailLoading(false);
  }`
);

// Add modal before closing div
content = content.replace(
  "    </div>\n  );\n}",
  `      {/* ONBOARDING EMAIL MODAL */}
      {showEmailModal && emailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowEmailModal(false); setGeneratedEmail(null); setEmailSent(false); setEmailError(null); }} />
          <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <img src="https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Zara.png" alt="Zara" className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <h2 className="text-lg font-bold text-white">Send Onboarding Email</h2>
                <p className="text-gray-400 text-sm">To: {emailTarget.full_name} · {emailTarget.email}</p>
              </div>
              <button onClick={() => { setShowEmailModal(false); setGeneratedEmail(null); setEmailSent(false); setEmailError(null); }} className="ml-auto text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            {emailSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-green-400 font-semibold text-lg">Email Sent!</p>
                <p className="text-gray-400 text-sm mt-1">Onboarding email delivered to {emailTarget.email}</p>
                <button onClick={() => { setShowEmailModal(false); setGeneratedEmail(null); setEmailSent(false); }} className="mt-4 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors">Close</button>
              </div>
            ) : (
              <>
                {emailError && <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm mb-4"><AlertCircle className="w-4 h-4" />{emailError}</div>}

                {!generatedEmail ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm mb-6">Zara will generate a personalized onboarding email using AI based on {emailTarget.full_name}'s role and profile.</p>
                    <button onClick={() => generateOnboardingEmail(emailTarget)} disabled={generating} className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto transition-colors">
                      {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Mail className="w-4 h-4" />Generate Onboarding Email</>}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Subject</label>
                      <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm text-white">{generatedEmail.subject}</div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Preview (Text)</label>
                      <div className="bg-gray-800 rounded-lg px-4 py-3 text-sm text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">{generatedEmail.text}</div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => { setGeneratedEmail(null); setEmailError(null); }} className="flex-1 px-4 py-2.5 border border-gray-700 text-gray-400 hover:text-white rounded-xl text-sm transition-colors">Regenerate</button>
                      <button onClick={sendOnboardingEmail} disabled={emailLoading} className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                        {emailLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Mail className="w-4 h-4" />Send Email</>}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');