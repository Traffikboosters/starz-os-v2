import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Code2, CheckCircle2, Clock, AlertTriangle, Upload, MessageSquare,
  BarChart3, Target, Zap, ChevronRight, Star, FileText, Users,
  Calendar, TrendingUp, ArrowUpRight, CheckSquare, Timer} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/useToast'
import { AnimatedCounter } from '@/components/AnimatedCounter'

const myTasks = [
  { id: 1, title: 'Google Ads Account Setup', workOrder: 'PPC Campaign - Phoenix Roofing', priority: 'high', status: 'done', dueDate: 'Jul 25', completedAt: 'Jul 24' },
  { id: 2, title: 'Keyword Research', workOrder: 'PPC Campaign - Phoenix Roofing', priority: 'high', status: 'in_progress', dueDate: 'Jul 26' },
  { id: 3, title: 'Ad Copy Creation', workOrder: 'PPC Campaign - Phoenix Roofing', priority: 'normal', status: 'todo', dueDate: 'Jul 28' },
  { id: 4, title: 'Landing Page Setup', workOrder: 'PPC Campaign - Phoenix Roofing', priority: 'high', status: 'todo', dueDate: 'Jul 29' },
  { id: 5, title: 'Technical SEO Audit', workOrder: 'SEO Premium - Miami Auto Group', priority: 'urgent', status: 'todo', dueDate: 'Jul 27' },
  { id: 6, title: 'Design Mockups', workOrder: 'Web Redesign - SF Tech Startup', priority: 'high', status: 'todo', dueDate: 'Aug 1' },
]

const teamNotes = [
  { user: 'Sarah Chen', text: 'Phoenix Roofing approved the ad strategy. Moving to keyword research phase.', time: '2h ago' },
  { user: 'Elena Rossi', text: 'Miami Auto Group wants to add GMB optimization to their package.', time: '4h ago' },
  { user: 'Marcus Webb', text: 'Need access to Seattle Coffee Co Google Analytics. Can someone share?', time: '5h ago' },
]

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-400 border-red-500/30',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  normal: 'bg-cyan/10 text-cyan border-cyan/30',
  low: 'bg-muted text-muted-foreground',
}

const statusIcons: Record<string, any> = {
  done: CheckCircle2,
  in_progress: Timer,
  todo: CheckSquare,
}

const statusColors: Record<string, string> = {
  done: 'text-emerald-400',
  in_progress: 'text-amber-400',
  todo: 'text-muted-foreground',
}

export default function DeveloperWorkspace() {
  const [tasks, setTasks] = useState(myTasks)
  const [noteText, setNoteText] = useState('')
  const { success, info } = useToast()

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const newStatus = t.status === 'done' ? 'todo' : t.status === 'todo' ? 'in_progress' : 'done'
      success(`Task "${t.title}" → ${newStatus}`)
      return { ...t, status: newStatus }
    }))
  }

  const doneCount = tasks.filter(t => t.status === 'done').length
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan" />
            Developer Workspace
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Task execution, deliverables, and team collaboration</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Tasks', value: tasks.length, icon: Target, color: 'text-cyan' },
          { label: 'Completed', value: doneCount, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Urgent', value: urgentCount, icon: AlertTriangle, color: 'text-red-400' },
          { label: 'Progress', value: Math.round((doneCount / tasks.length) * 100), suffix: '%', icon: TrendingUp, color: 'text-violet' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-2xl bg-card border border-border/40 card-glow">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">
              {m.suffix ? `${m.value}${m.suffix}` : <AnimatedCounter end={m.value} />}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Tasks */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border/40 card-glow">
          <h3 className="font-semibold text-foreground text-sm mb-4">My Tasks</h3>
          <div className="space-y-2">
            {tasks.map((task) => {
              const StatusIcon = statusIcons[task.status] || CheckSquare
              return (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-space-highlight/30 transition-all group cursor-pointer" onClick={() => toggleTask(task.id)}>
                  <div className={`mt-0.5 ${statusColors[task.status]}`}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.title}</span>
                      <Badge className={`text-[10px] ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{task.workOrder}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {task.dueDate}</span>
                      {task.status === 'done' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Due Soon */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
            <h3 className="font-semibold text-foreground text-sm mb-3">Due Soon</h3>
            <div className="space-y-2">
              {tasks.filter(t => t.status !== 'done').slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-space-highlight/30">
                  <span className="text-xs text-foreground truncate flex-1">{t.title}</span>
                  <span className="text-[10px] text-amber-400 ml-2">{t.dueDate}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Team Notes */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-5 rounded-2xl bg-card border border-border/40 card-glow">
            <h3 className="font-semibold text-foreground text-sm mb-3">Team Notes</h3>
            <div className="space-y-3">
              {teamNotes.map((note, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-space-highlight/30 border border-border/20">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-cyan/10 flex items-center justify-center">
                      <span className="text-[9px] text-cyan font-bold">{note.user[0]}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{note.user}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{note.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{note.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
