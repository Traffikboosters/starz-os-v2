const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\hr\\page.tsx';
const content = `'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, Shield, FileText, AlertCircle, Mail, ClipboardList, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

const ZARA_AVATAR = 'https://szguizvpiiuiyugrjeks.supabase.co/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Rico.png';

type Tab = 'staff' | 'roles' | 'compliance' | 'documents' | 'invites' | 'audit';

interface HRUser { id: string; full_name: string | null; email: string | null; role_status: string | null; created_at: string | null; }
interface Role { id: string; role_key: string; role_name: string; }
interface UserRole { user_id: string; role_id: string; }
interface Permission { id: string; permission_key: string; description: string | null; }
interface RolePermission { role_id: string; permission_key: string; allowed: boolean; }
interface ComplianceRule { id: string; state_code: string; role_key: string; min_wage: number | null; requires_overtime_policy: boolean; allowed_worker_types: string[] | null; active: boolean; }
interface Document { id: string; doc_type: string | null; status: string | null; created_at: string | null; }
interface Invite { id: string; email: string; role_key: string | null; status: string | null; invited_at: string | null; }
interface AuditLog { id: string; event_type: string; created_at: string; event_payload: Record<string, any> | null; }

function fmt(d: string | null) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function StatusBadge({ status }: { status: string | null }) {
  const c: Record<string, string> = { active: 'text-green-400 bg-green-400/10', inactive: 'text-gray-400 bg-gray-400/10', pending: 'text-yellow-400 bg-yellow-400/10', accepted: 'text-blue-400 bg-blue-400/10', rejected: 'text-red-400 bg-red-400/10' };
  return <span className={\`px-2 py-0.5 rounded-full text-xs font-medium capitalize \${c[status?.toLowerCase() || ''] || 'text-gray-400 bg-gray-400/10'}\`}>{status || '—'}</span>;
}

export default function HRPortal() {
  const [tab, setTab] = useState<Tab>('staff');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<HRUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [compliance, setCompliance] = useState<ComplianceRule[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [audit, setAudit] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, pending_invites: 0, open_alerts: 0 });

  useEffect(() => { loadTab(tab); }, [tab]);

  async function loadTab(t: Tab) {
    setLoading(true); setError(null);
    const sb = createClient();
    try {
      if (t === 'staff') {
        const [u, ur, r] = await Promise.all([
          sb.schema('hr').from('users').select('*').order('created_at', { ascending: false }),
          sb.schema('hr').from('user_roles').select('*'),
          sb.schema('hr').from('roles').select('*'),
        ]);
        if (u.error) throw u.error;
        setUsers(u.data || []);
        setUserRoles(ur.data || []);
        setRoles(r.data || []);
        setMetrics({
          total: u.data?.length || 0,
          active: u.data?.filter(x => x.role_status === 'active').length || 0,
          pending_invites: 0,
          open_alerts: 0,
        });
      } else if (t === 'roles') {
        const [r, p, rp] = await Promise.all([
          sb.schema('hr').from('roles').select('*').order('role_key'),
          sb.schema('hr').from('permissions').select('*').order('permission_key'),
          sb.schema('hr').from('role_permissions').select('role_id, permission_key, allowed'),
        ]);
        if (r.error) throw r.error;
        setRoles(r.data || []);
        setPermissions(p.data || []);
        setRolePermissions(rp.data || []);
      } else if (t === 'compliance') {
        const { data, error } = await sb.schema('hr').from('compliance_rules').select('*').order('state_code');
        if (error) throw error;
        setCompliance(data || []);
      } else if (t === 'documents') {
        const { data, error } = await sb.schema('hr').from('documents').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setDocuments(data || []);
      } else if (t === 'invites') {
        const { data, error } = await sb.schema('hr').from('user_invites').select('*').order('invited_at', { ascending: false });
        if (error) throw error;
        setInvites(data || []);
      } else if (t === 'audit') {
        const { data, error } = await sb.schema('hr').from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        setAudit(data || []);
      }
    } catch (e: any) { setError(e.message || 'Failed to load'); }
    setLoading(false);
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'staff', label: 'Staff Directory', icon: Users },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'invites', label: 'Invites', icon: Mail },
    { id: 'audit', label: 'Audit Log', icon: ClipboardList },
  ];

  const q = search.toLowerCase();

  function getUserRoles(userId: string) {
    const roleIds = userRoles.filter(ur => ur.user_id === userId).map(ur => ur.role_id);
    return roles.filter(r => roleIds.includes(r.id)).map(r => r.role_name);
  }

  function getRolePerms(roleId: string) {
    return rolePermissions.filter(rp => rp.role_id === roleId);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Users className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">HR Portal</h1>
          <p className="text-gray-400 text-sm">Managed by Zara · HR Director AI</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Staff', value: metrics.total, color: 'text-white' },
          { label: 'Active', value: metrics.active, color: 'text-green-400' },
          { label: 'Roles Configured', value: roles.length || 5, color: 'text-blue-400' },
          { label: 'Compliance Rules', value: compliance.length || '—', color: 'text-orange-400' },
        ].map(m => (
          <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={\`text-2xl font-bold \${m.color}\`}>{m.value}</div>
            <div className="text-xs text-gray-400 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setTab(id); setSearch(''); }}
            className={\`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap \${tab === id ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-white'}\`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
      </div>

      {error && <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm mb-4"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 gap-2"><Loader2 className="w-5 h-5 animate-spin" />Loading...</div>
      ) : (
        <>
          {/* STAFF DIRECTORY */}
          {tab === 'staff' && (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              {users.length === 0 ? <div className="py-20 text-center text-gray-500 text-sm">No staff found</div> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                    <tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Roles</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Joined</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {users.filter(u => !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)).map(u => (
                      <tr key={u.id} className="hover:bg-gray-900/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{u.full_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{u.email || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {getUserRoles(u.id).map(r => (
                              <span key={r} className="px-2 py-0.5 rounded-full text-xs bg-purple-400/10 text-purple-400">{r}</span>
                            ))}
                            {getUserRoles(u.id).length === 0 && <span className="text-gray-500 text-xs">No roles</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={u.role_status} /></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmt(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ROLES & PERMISSIONS */}
          {tab === 'roles' && (
            <div className="space-y-4">
              {roles.filter(r => !q || r.role_key.includes(q) || r.role_name.toLowerCase().includes(q)).map(role => {
                const perms = getRolePerms(role.id);
                return (
                  <div key={role.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-white">{role.role_name}</span>
                      <span className="text-xs text-gray-500 font-mono">{role.role_key}</span>
                    </div>
                    {perms.length === 0 ? (
                      <p className="text-gray-500 text-xs">No permissions configured</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {perms.map(p => (
                          <span key={p.permission_key} className={\`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 \${p.allowed ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}\`}>
                            {p.allowed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {p.permission_key}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* COMPLIANCE */}
          {tab === 'compliance' && (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              {compliance.length === 0 ? <div className="py-20 text-center text-gray-500 text-sm">No compliance rules found</div> : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                    <tr><th className="px-4 py-3 text-left">State</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Min Wage</th><th className="px-4 py-3 text-left">Overtime Policy</th><th className="px-4 py-3 text-left">Worker Types</th><th className="px-4 py-3 text-left">Active</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {compliance.filter(c => !q || c.state_code.toLowerCase().includes(q) || c.role_key.toLowerCase().includes(q)).map(c => (
                      <tr key={c.id} className="hover:bg-gray-900/50 transition-colors">
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-400/10 text-blue-400 rounded-lg text-xs font-bold">{c.state_code}</span></td>
                        <td className="px-4 py-3 text-gray-300 capitalize">{c.role_key}</td>
                        <td className="px-4 py-3 text-gray-300">{c.min_wage ? \`$\${c.min_wage}/hr\` : '—'}</td>
                        <td className="px-4 py-3">{c.requires_overtime_policy ? <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Required</span> : <span className="text-gray-500 text-xs">Not required</span>}</td>
                        <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(c.allowed_worker_types || []).map(t => <span key={t} className="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">{t}</span>)}</div></td>
                        <td className="px-4 py-3">{c.active ? <span className="text-green-400 text-xs">Active</span> : <span className="text-gray-500 text-xs">Inactive</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* DOCUMENTS */}
          {tab === 'documents' && (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              {documents.length === 0 ? (
                <div className="py-20 text-center text-gray-500 text-sm">No documents uploaded yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                    <tr><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Created</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {documents.filter(d => !q || d.doc_type?.toLowerCase().includes(q)).map(d => (
                      <tr key={d.id} className="hover:bg-gray-900/50 transition-colors">
                        <td className="px-4 py-3 text-white capitalize">{d.doc_type || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmt(d.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* INVITES */}
          {tab === 'invites' && (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              {invites.length === 0 ? (
                <div className="py-20 text-center text-gray-500 text-sm">No invites sent yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                    <tr><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Invited</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {invites.filter(i => !q || i.email?.toLowerCase().includes(q) || i.role_key?.toLowerCase().includes(q)).map(i => (
                      <tr key={i.id} className="hover:bg-gray-900/50 transition-colors">
                        <td className="px-4 py-3 text-white">{i.email}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-purple-400/10 text-purple-400 capitalize">{i.role_key || '—'}</span></td>
                        <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{fmt(i.invited_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* AUDIT LOG */}
          {tab === 'audit' && (
            <div className="space-y-2">
              {audit.length === 0 ? (
                <div className="py-20 text-center text-gray-500 text-sm">No audit events yet</div>
              ) : (
                audit.filter(a => !q || a.event_type?.toLowerCase().includes(q)).map(a => (
                  <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-white">{a.event_type.replace(/_/g, ' ')}</p>
                          {a.event_payload && (
                            <p className="text-xs text-gray-500 mt-1">{JSON.stringify(a.event_payload).slice(0, 120)}...</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{fmt(a.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
`;
fs.writeFileSync(path, content, 'utf8');
console.log('Done');