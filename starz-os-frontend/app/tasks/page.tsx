'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, CheckCircle, Clock, AlertCircle, Loader2, Zap, Circle, Search } from 'lucide-react';

interface Task {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  work_order_id: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-green-500/20 text-green-400',
  blocked: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-white/10 text-white/30',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-white/30',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDueDate(dateStr: string | null) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: 'text-red-400' };
  if (days === 0) return { label: 'Due today', color: 'text-orange-400' };
  if (days <= 3) return { label: `${days}d left`, color: 'text-yellow-400' };
  return { label: `${days}d left`, color: 'text-white/40' };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .schema('deals')
          .from('tasks')
          .select('id, title, description, status, priority, due_date, created_at, completed_at, work_order_id')
          .order('created_at', { ascending: false })
          .limit(100);
        if (error) throw new Error(error.message);
        setTasks(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const sub = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'deals', table: 'tasks' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  async function completeTask(id: string) {
    setUpdating(id);
    const supabase = createClient();
    await supabase
      .schema('deals')
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id);
    setUpdating(null);
  }

  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">

        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Tasks</h2>
              <p className="text-sm text-white/50 mt-0.5">Fulfillment • Live from Supabase</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs text-purple-400 font-medium">{total} total tasks</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Total</span>
                <ClipboardList className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Pending</span>
                <Clock className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">In Progress</span>
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-white/50">Completed</span>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? '—' : completed}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-cyan-400" />
                All Tasks
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500/50 w-48"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-white/30">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading tasks...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-white/20 text-sm">No tasks found</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((task) => {
                  const due = formatDueDate(task.due_date);
                  return (
                    <div key={task.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                      <button
                        onClick={() => task.status !== 'completed' && completeTask(task.id)}
                        disabled={task.status === 'completed' || updating === task.id}
                        className="flex-shrink-0"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : updating === task.id ? (
                          <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                        ) : (
                          <Circle className="w-5 h-5 text-white/20 hover:text-cyan-400 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-white/30' : 'text-white'}`}>
                          {task.title || 'Untitled task'}
                        </p>
                        {task.description && (
                          <p className="text-xs text-white/30 mt-0.5 truncate">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {due && (
                          <span className={`text-xs ${due.color}`}>{due.label}</span>
                        )}
                        {task.priority && (
                          <span className={`text-xs font-medium capitalize ${PRIORITY_COLORS[task.priority] || 'text-white/30'}`}>
                            {task.priority}
                          </span>
                        )}
                        <Badge className={STATUS_COLORS[task.status || ''] || 'bg-white/10 text-white/50'}>
                          {task.status?.replace('_', ' ') || 'unknown'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}