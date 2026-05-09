import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, UserCheck, AlertTriangle, TrendingUp, MapPin,
  CreditCard, Clock, CheckCircle2, XCircle, Zap, Brain, Shield,
  ChevronRight, ChevronDown, Play, Pause, Globe, Search, Filter,
  BarChart3, Activity, Award, BookOpen, Mail, Phone, Send,
  Monitor, Smartphone, FileText, Calendar, Target, Percent,
  DollarSign, Layers, Radio, RefreshCw, Star, CircleDot, Rocket,
  Eye, MoreHorizontal, ChevronLeft, ExternalLink, Check, MessageSquare,
  Lock, Unlock, Ban, GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/useToast'
import { AnimatedCounter } from '@/components/AnimatedCounter'

// ─── Types ───────────────────────────────────────────────────────────

interface Applicant {
  id: string
  name: string
  email: string
  phone: string
  role: 'BGE Contractor' | 'Sales Rep' | 'SEO Specialist' | 'Developer' | 'Ads Specialist' | 'Closer' | 'Appointment Setter'
  status: 'new' | 'screening' | 'interview' | 'approved' | 'onboarding' | 'active' | 'rejected' | 'churned'
  source: string
  city: string
  state: string
  appliedDate: string
  interviewDate?: string
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended'
  onboardingProgress: number
  closeRate?: number
  revenueGenerated?: number
  lastActive?: string
  avatar: string
}

interface JobPost {
  id: string
  title: string
  platform: string
  status: 'live' | 'paused' | 'expired'
  applicants: number
  postedDate: string
  role: string
  location: string
  roi: number
}

interface OnboardingStep {
  id: string
  label: string
  required: boolean
  completed: boolean
  completionDate?: string
}

interface WorkforceMetric {
  label: string
  value: number
  change: number
  icon: any
  color: string
}

interface Notification {
  id: string
  type: 'application' | 'payment' | 'onboarding' | 'alert' | 'completion'
  message: string
  time: string
}

// ─── Demo Data ───────────────────────────────────────────────────────

const DEMO_APPLICANTS: Applicant[] = [
  { id: 'APP-001', name: 'Tasha Brown', email: 'tasha@email.com', phone: '(404) 555-0101', role: 'BGE Contractor', status: 'active', source: 'LinkedIn', city: 'Atlanta', state: 'GA', appliedDate: 'Jul 15', subscriptionStatus: 'active', onboardingProgress: 100, closeRate: 68, revenueGenerated: 48600, lastActive: 'Just now', avatar: '/avatar-zara.jpg' },
  { id: 'APP-002', name: 'Mike Williams', email: 'mike.w@email.com', phone: '(713) 555-0202', role: 'BGE Contractor', status: 'active', source: 'Indeed', city: 'Houston', state: 'TX', appliedDate: 'Jul 18', subscriptionStatus: 'active', onboardingProgress: 100, closeRate: 72, revenueGenerated: 52400, lastActive: '2m ago', avatar: '/avatar-steve.jpg' },
  { id: 'APP-003', name: 'DJ Martinez', email: 'dj@email.com', phone: '(305) 555-0303', role: 'Sales Rep', status: 'active', source: 'Referral', city: 'Miami', state: 'FL', appliedDate: 'Jul 20', subscriptionStatus: 'active', onboardingProgress: 100, closeRate: 64, revenueGenerated: 38700, lastActive: '5m ago', avatar: '/avatar-rico.jpg' },
  { id: 'APP-004', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '(786) 555-0404', role: 'Closer', status: 'active', source: 'LinkedIn', city: 'Miami', state: 'FL', appliedDate: 'Jul 12', subscriptionStatus: 'active', onboardingProgress: 100, closeRate: 81, revenueGenerated: 72300, lastActive: '12m ago', avatar: '/avatar-1.jpg' },
  { id: 'APP-005', name: 'Elena Rossi', email: 'elena@email.com', phone: '(212) 555-0505', role: 'BGE Contractor', status: 'active', source: 'Craigslist', city: 'New York', state: 'NY', appliedDate: 'Jul 22', subscriptionStatus: 'active', onboardingProgress: 100, closeRate: 75, revenueGenerated: 61200, lastActive: '15m ago', avatar: '/avatar-2.jpg' },
  { id: 'APP-006', name: 'Marcus Webb', email: 'marcus@email.com', phone: '(310) 555-0606', role: 'Sales Rep', status: 'active', source: 'Indeed', city: 'Los Angeles', state: 'CA', appliedDate: 'Jul 25', subscriptionStatus: 'trial', onboardingProgress: 85, closeRate: 54, revenueGenerated: 12800, lastActive: '1h ago', avatar: '/avatar-3.jpg' },
  { id: 'APP-007', name: 'Aisha Patel', email: 'aisha@email.com', phone: '(312) 555-0707', role: 'Appointment Setter', status: 'onboarding', source: 'Monster', city: 'Chicago', state: 'IL', appliedDate: 'Jul 28', subscriptionStatus: 'trial', onboardingProgress: 60, closeRate: undefined, revenueGenerated: 0, lastActive: '2h ago', avatar: '/avatar-1.jpg' },
  { id: 'APP-008', name: 'James Park', email: 'james@email.com', phone: '(415) 555-0808', role: 'BGE Contractor', status: 'onboarding', source: 'LinkedIn', city: 'San Francisco', state: 'CA', appliedDate: 'Jul 29', subscriptionStatus: 'trial', onboardingProgress: 35, closeRate: undefined, revenueGenerated: 0, lastActive: '3h ago', avatar: '/avatar-2.jpg' },
  { id: 'APP-009', name: 'Lisa Thompson', email: 'lisa@email.com', phone: '(602) 555-0909', role: 'SEO Specialist', status: 'interview', source: 'Indeed', city: 'Phoenix', state: 'AZ', appliedDate: 'Jul 30', subscriptionStatus: undefined, onboardingProgress: 0, closeRate: undefined, revenueGenerated: 0, lastActive: undefined, avatar: '/avatar-3.jpg' },
  { id: 'APP-010', name: 'Carlos Rivera', email: 'carlos@email.com', phone: '(214) 555-1010', role: 'Ads Specialist', status: 'screening', source: 'Craigslist', city: 'Dallas', state: 'TX', appliedDate: 'Aug 1', subscriptionStatus: undefined, onboardingProgress: 0, closeRate: undefined, revenueGenerated: 0, lastActive: undefined, avatar: '/avatar-steve.jpg' },
  { id: 'APP-011', name: 'Amanda Foster', email: 'amanda@email.com', phone: '(503) 555-1111', role: 'BGE Contractor', status: 'approved', source: 'Referral', city: 'Portland', state: 'OR', appliedDate: 'Aug 2', subscriptionStatus: undefined, onboardingProgress: 0, closeRate: undefined, revenueGenerated: 0, lastActive: undefined, avatar: '/avatar-zara.jpg' },
  { id: 'APP-012', name: 'Kevin Lee', email: 'kevin@email.com', phone: '(206) 555-1212', role: 'Developer', status: 'new', source: 'LinkedIn', city: 'Seattle', state: 'WA', appliedDate: 'Aug 3', subscriptionStatus: undefined, onboardingProgress: 0, closeRate: undefined, revenueGenerated: 0, lastActive: undefined, avatar: '/avatar-rico.jpg' },
  { id: 'APP-013', name: 'Rachel Green', email: 'rachel@email.com', phone: '(407) 555-1313', role: 'BGE Contractor', status: 'churned', source: 'Indeed', city: 'Orlando', state: 'FL', appliedDate: 'Jun 15', subscriptionStatus: 'cancelled', onboardingProgress: 100, closeRate: 12, revenueGenerated: 3400, lastActive: '2w ago', avatar: '/avatar-1.jpg' },
  { id: 'APP-014', name: 'David Chen', email: 'david@email.com', phone: '(702) 555-1414', role: 'Closer', status: 'rejected', source: 'Monster', city: 'Las Vegas', state: 'NV', appliedDate: 'Aug 1', subscriptionStatus: undefined, onboardingProgress: 0, closeRate: undefined, revenueGenerated: 0, lastActive: undefined, avatar: '/avatar-2.jpg' },
  { id: 'APP-015', name: 'Nicole Adams', email: 'nicole@email.com', phone: '(904) 555-1515', role: 'BGE Contractor', status: 'past_due', source: 'LinkedIn', city: 'Jacksonville', state: 'FL', appliedDate: 'Jul 5', subscriptionStatus: 'past_due', onboardingProgress: 100, closeRate: 45, revenueGenerated: 18200, lastActive: '5d ago', avatar: '/avatar-3.jpg' },
]

const DEMO_JOB_POSTS: JobPost[] = [
  { id: 'JOB-001', title: 'BGE Contractor - Business Growth Expert', platform: 'LinkedIn Jobs', status: 'live', applicants: 47, postedDate: 'Jul 15', role: 'BGE Contractor', location: 'Remote', roi: 4.2 },
  { id: 'JOB-002', title: 'Senior Sales Representative', platform: 'Indeed', status: 'live', applicants: 32, postedDate: 'Jul 18', role: 'Sales Rep', location: 'Miami, FL', roi: 3.8 },
  { id: 'JOB-003', title: 'SEO Specialist - Agency Level', platform: 'Craigslist', status: 'live', applicants: 18, postedDate: 'Jul 20', role: 'SEO Specialist', location: 'Remote', roi: 5.1 },
  { id: 'JOB-004', title: 'PPC Ads Specialist', platform: 'Monster', status: 'paused', applicants: 12, postedDate: 'Jul 22', role: 'Ads Specialist', location: 'Remote', roi: 2.9 },
  { id: 'JOB-005', title: 'High Ticket Closer', platform: 'LinkedIn Jobs', status: 'live', applicants: 24, postedDate: 'Jul 25', role: 'Closer', location: 'Remote', roi: 6.3 },
  { id: 'JOB-006', title: 'Appointment Setter', platform: 'Indeed', status: 'expired', applicants: 9, postedDate: 'Jul 1', role: 'Appointment Setter', location: 'Atlanta, GA', roi: 1.8 },
  { id: 'JOB-007', title: 'Full Stack Developer', platform: 'LinkedIn Jobs', status: 'live', applicants: 15, postedDate: 'Aug 1', role: 'Developer', location: 'Remote', roi: 3.5 },
  { id: 'JOB-008', title: 'BGE Contractor - Entry Level', platform: 'Craigslist', status: 'live', applicants: 21, postedDate: 'Aug 2', role: 'BGE Contractor', location: 'Remote', roi: 3.9 },
]

const ONBOARDING_TEMPLATE: OnboardingStep[] = [
  { id: 's1', label: 'Welcome Email Sent', required: true, completed: true, completionDate: 'Day 1' },
  { id: 's2', label: 'Contractor Agreement Signed', required: true, completed: true, completionDate: 'Day 1' },
  { id: 's3', label: 'Payment Processed ($695/mo)', required: true, completed: true, completionDate: 'Day 1' },
  { id: 's4', label: 'Account Created', required: true, completed: true, completionDate: 'Day 1' },
  { id: 's5', label: 'Email Provisioning (@traffikboosters.com)', required: true, completed: true, completionDate: 'Day 1' },
  { id: 's6', label: 'Policy Documents Acknowledged', required: true, completed: true, completionDate: 'Day 2' },
  { id: 's7', label: 'Compensation Plan Reviewed', required: true, completed: true, completionDate: 'Day 2' },
  { id: 's8', label: 'Script Certification', required: true, completed: false },
  { id: 's9', label: 'CRM Walkthrough', required: true, completed: false },
  { id: 's10', label: 'PowerDial Training', required: true, completed: false },
  { id: 's11', label: 'Compliance Acknowledgement', required: true, completed: false },
  { id: 's12', label: 'KPI Expectations Review', required: true, completed: false },
  { id: 's13', label: 'Lead Pool Eligibility', required: true, completed: false },
]

const NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'application', message: 'New application: Kevin Lee (Developer) from Seattle', time: '2m ago' },
  { id: 'n2', type: 'payment', message: 'Mike Williams subscription payment confirmed: $695', time: '5m ago' },
  { id: 'n3', type: 'onboarding', message: 'Aisha Patel completed Script Certification', time: '12m ago' },
  { id: 'n4', type: 'alert', message: 'ALERT: Nicole Adams subscription 5 days past due', time: '15m ago' },
  { id: 'n5', type: 'completion', message: 'James Park completed CRM Walkthrough', time: '34m ago' },
  { id: 'n6', type: 'alert', message: 'Rachel Green (Orlando) churned - low performance', time: '1h ago' },
  { id: 'n7', type: 'application', message: 'New application: Amanda Foster from Portland, OR', time: '2h ago' },
  { id: 'n8', type: 'payment', message: 'Auto-pay failed for 1 contractor - suspension pending', time: '3h ago' },
]

// ─── Status Helpers ──────────────────────────────────────────────────

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  new: { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: UserPlus },
  screening: { color: 'text-cyan', bg: 'bg-cyan/10', icon: Eye },
  interview: { color: 'text-violet-400', bg: 'bg-violet-500/10', icon: Calendar },
  approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  onboarding: { color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Activity },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
  churned: { color: 'text-muted-foreground', bg: 'bg-muted', icon: AlertTriangle },
  past_due: { color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle },
}

const subConfig: Record<string, { color: string; bg: string }> = {
  trial: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  past_due: { color: 'text-red-400', bg: 'bg-red-500/10' },
  cancelled: { color: 'text-muted-foreground', bg: 'bg-muted' },
  suspended: { color: 'text-red-400', bg: 'bg-red-500/10' },
}

function getOnboardingSteps(progress: number): OnboardingStep[] {
  const completedCount = Math.floor((progress / 100) * ONBOARDING_TEMPLATE.length)
  return ONBOARDING_TEMPLATE.map((s, i) => ({
    ...s,
    completed: i < completedCount,
    completionDate: i < completedCount ? s.completionDate || 'Completed' : undefined,
  }))
}

// ─── Training & Certification Data ────────────────────────────────────

interface TrainingModule {
  id: string; title: string; required: boolean; duration: string
  completed: number; total: number; avgScore: number; status: string
}

const TRAINING_MODULES: TrainingModule[] = [
  { id: 't1', title: 'Onboarding Orientation', required: true, duration: '30 min', completed: 14, total: 15, avgScore: 92, status: 'active' },
  { id: 't2', title: 'Policy & Compliance', required: true, duration: '45 min', completed: 13, total: 15, avgScore: 88, status: 'active' },
  { id: 't3', title: 'Script Certification', required: true, duration: '60 min', completed: 11, total: 15, avgScore: 84, status: 'active' },
  { id: 't4', title: 'CRM Walkthrough', required: true, duration: '40 min', completed: 12, total: 15, avgScore: 90, status: 'active' },
  { id: 't5', title: 'PowerDial Training', required: true, duration: '35 min', completed: 10, total: 15, avgScore: 87, status: 'active' },
  { id: 't6', title: 'Compensation Plan', required: true, duration: '20 min', completed: 14, total: 15, avgScore: 95, status: 'active' },
  { id: 't7', title: 'KPI & Expectations', required: true, duration: '25 min', completed: 13, total: 15, avgScore: 91, status: 'active' },
  { id: 't8', title: 'Advanced Closing', required: false, duration: '90 min', completed: 6, total: 15, avgScore: 78, status: 'optional' },
  { id: 't9', title: 'SEO Fundamentals', required: false, duration: '50 min', completed: 4, total: 15, avgScore: 82, status: 'optional' },
  { id: 't10', title: 'Objection Handling', required: false, duration: '40 min', completed: 8, total: 15, avgScore: 85, status: 'optional' },
]

const CERTIFICATIONS = [
  { id: 'c1', name: 'Tasha Brown', modulesDone: 10, totalModules: 10, quizAvg: 94, certified: true, readyForLeads: true, avatar: '/avatar-zara.jpg' },
  { id: 'c2', name: 'Mike Williams', modulesDone: 10, totalModules: 10, quizAvg: 91, certified: true, readyForLeads: true, avatar: '/avatar-steve.jpg' },
  { id: 'c3', name: 'DJ Martinez', modulesDone: 10, totalModules: 10, quizAvg: 89, certified: true, readyForLeads: true, avatar: '/avatar-rico.jpg' },
  { id: 'c4', name: 'Sarah Johnson', modulesDone: 10, totalModules: 10, quizAvg: 96, certified: true, readyForLeads: true, avatar: '/avatar-1.jpg' },
  { id: 'c5', name: 'Elena Rossi', modulesDone: 10, totalModules: 10, quizAvg: 88, certified: true, readyForLeads: true, avatar: '/avatar-2.jpg' },
  { id: 'c6', name: 'Marcus Webb', modulesDone: 8, totalModules: 10, quizAvg: 76, certified: false, readyForLeads: false, avatar: '/avatar-3.jpg' },
  { id: 'c7', name: 'Aisha Patel', modulesDone: 6, totalModules: 10, quizAvg: 72, certified: false, readyForLeads: false, avatar: '/avatar-1.jpg' },
  { id: 'c8', name: 'James Park', modulesDone: 4, totalModules: 10, quizAvg: 68, certified: false, readyForLeads: false, avatar: '/avatar-2.jpg' },
]

const EMAIL_TEMPLATES = [
  { id: 'e1', name: 'Welcome Sequence', trigger: 'Onboarding start', status: 'active', sent: 45, openRate: 92 },
  { id: 'e2', name: 'Payment Reminder', trigger: '5 days past due', status: 'active', sent: 12, openRate: 78 },
  { id: 'e3', name: 'Trial Ending', trigger: '3 days before expiry', status: 'active', sent: 8, openRate: 85 },
  { id: 'e4', name: 'Interview Invite', trigger: 'Approved candidate', status: 'active', sent: 23, openRate: 88 },
  { id: 'e5', name: 'Training Reminder', trigger: 'Incomplete after 48h', status: 'active', sent: 18, openRate: 71 },
  { id: 'e6', name: 'Performance Coaching', trigger: 'Close rate &lt; 30%', status: 'active', sent: 6, openRate: 65 },
  { id: 'e7', name: 'Reactivation', trigger: 'Churned 7+ days', status: 'paused', sent: 4, openRate: 42 },
]

// ─── Security / Access Control Data ───────────────────────────────────

const ACCESS_POLICIES = [
  { id: 'p1', name: 'Auto-suspend on payment failure', status: true, description: 'If subscription payment fails 2x, auto-suspend account' },
  { id: 'p2', name: 'Restrict exports for trial users', status: true, description: 'Trial users cannot export leads or contacts' },
  { id: 'p3', name: 'Lead pool after certification', status: true, description: 'Only certified contractors receive live leads' },
  { id: 'p4', name: 'Admin-only signature editing', status: true, description: 'Only admins can edit company signatures' },
  { id: 'p5', name: 'Auto-offboard on churn', status: false, description: 'Automatically revoke access when contractor churns' },
  { id: 'p6', name: '2FA for admin accounts', status: true, description: 'Require two-factor authentication for admin portal' },
  { id: 'p7', name: 'IP whitelist for PowerDial', status: false, description: 'Restrict PowerDial access to whitelisted IPs' },
  { id: 'p8', name: 'Session timeout (30min)', status: true, description: 'Auto-logout after 30 minutes of inactivity' },
]

const SECURITY_LOGS = [
  { id: 's1', action: 'Account suspended', target: 'Nicole Adams', reason: 'Payment failed 2x', time: '15 min ago', severity: 'high' },
  { id: 's2', action: 'Lead export blocked', target: 'Marcus Webb', reason: 'Trial user restriction', time: '45 min ago', severity: 'medium' },
  { id: 's3', action: 'Permission escalated', target: 'Sarah Johnson', reason: 'Promoted to Senior Closer', time: '2h ago', severity: 'low' },
  { id: 's4', action: 'Auto-offboarded', target: 'Rachel Green', reason: 'Churned - 30 days inactive', time: '3h ago', severity: 'medium' },
  { id: 's5', action: 'Failed login attempt', target: 'admin@traffikboosters.com', reason: 'Wrong password (3x)', time: '5h ago', severity: 'high' },
  { id: 's6', action: 'Portal access granted', target: 'James Park', reason: 'Onboarding 60% complete', time: '6h ago', severity: 'low' },
]

// ─── Main Component ───────────────────────────────────────────────────

export default function ZaraHR() {
  const [activeTab, setActiveTab] = useState('overview')
  const [applicants, setApplicants] = useState<Applicant[]>(DEMO_APPLICANTS)
  const [jobs] = useState<JobPost[]>(DEMO_JOB_POSTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(null)
  const [selectedJobPlatforms, setSelectedJobPlatforms] = useState<string[]>(['LinkedIn Jobs', 'Indeed'])
  const [jobDescription, setJobDescription] = useState('')
  const { success, info } = useToast()

  const filteredApplicants = applicants.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.city.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    const matchesRole = roleFilter === 'all' || a.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const selected = applicants.find(a => a.id === selectedApplicant)

  // Metrics
  const totalApplicants = applicants.length
  const activeInterviews = applicants.filter(a => a.status === 'interview').length
  const approvedCount = applicants.filter(a => ['approved', 'onboarding', 'active'].includes(a.status)).length
  const onboardingPending = applicants.filter(a => a.status === 'onboarding').length
  const activeBGEs = applicants.filter(a => a.status === 'active' && a.role === 'BGE Contractor').length
  const activeReps = applicants.filter(a => a.status === 'active').length
  const churnRisk = applicants.filter(a => a.status === 'past_due' || (a.closeRate && a.closeRate < 30)).length
  const failedOnboarding = applicants.filter(a => a.status === 'rejected').length
  const activeSubs = applicants.filter(a => a.subscriptionStatus === 'active').length
  const trialSubs = applicants.filter(a => a.subscriptionStatus === 'trial').length
  const monthlyRecurring = activeSubs * 695

  const metrics: WorkforceMetric[] = [
    { label: 'Total Applicants', value: totalApplicants, change: +12, icon: Users, color: 'text-cyan' },
    { label: 'Active Interviews', value: activeInterviews, change: +3, icon: Calendar, color: 'text-violet-400' },
    { label: 'Approved', value: approvedCount, change: +5, icon: UserCheck, color: 'text-emerald-400' },
    { label: 'Onboarding', value: onboardingPending, change: +2, icon: Clock, color: 'text-amber-400' },
    { label: 'Active BGEs', value: activeBGEs, change: +4, icon: Target, color: 'text-cyan' },
    { label: 'Active Reps', value: activeReps, change: +3, icon: Activity, color: 'text-emerald-400' },
    { label: 'Churn Risk', value: churnRisk, change: -1, icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Failed', value: failedOnboarding, change: +0, icon: XCircle, color: 'text-muted-foreground' },
    { label: 'Active Subs', value: activeSubs, change: +2, icon: CreditCard, color: 'text-emerald-400' },
    { label: 'Trial Subs', value: trialSubs, change: +3, icon: Zap, color: 'text-amber-400' },
    { label: 'MRR', value: monthlyRecurring, change: +18, icon: DollarSign, color: 'text-cyan' },
    { label: 'Live Jobs', value: jobs.filter(j => j.status === 'live').length, change: +2, icon: Globe, color: 'text-violet-400' },
  ]

  // Pipeline stages count
  const pipelineStages = [
    { label: 'New', count: applicants.filter(a => a.status === 'new').length, color: 'bg-blue-500' },
    { label: 'Screening', count: applicants.filter(a => a.status === 'screening').length, color: 'bg-cyan-500' },
    { label: 'Interview', count: applicants.filter(a => a.status === 'interview').length, color: 'bg-violet-500' },
    { label: 'Approved', count: applicants.filter(a => a.status === 'approved').length, color: 'bg-emerald-500' },
    { label: 'Onboarding', count: applicants.filter(a => a.status === 'onboarding').length, color: 'bg-amber-500' },
    { label: 'Active', count: applicants.filter(a => a.status === 'active').length, color: 'bg-emerald-400' },
  ]

  const advanceApplicant = (id: string) => {
    const flow = ['new', 'screening', 'interview', 'approved', 'onboarding', 'active']
    setApplicants(prev => prev.map(a => {
      if (a.id !== id) return a
      const idx = flow.indexOf(a.status)
      if (idx === -1 || idx === flow.length - 1) return a
      const newStatus = flow[idx + 1] as Applicant['status']
      success(`${a.name} moved to ${newStatus}`)
      return { ...a, status: newStatus, onboardingProgress: newStatus === 'active' ? 100 : a.onboardingProgress }
    }))
  }

  const generateJobDescription = () => {
    const template = `Business Growth Expert (BGE) - STARZ-OS Contractor

About the Role:
We are seeking driven sales professionals to join STARZ-OS as Business Growth Experts (BGEs). You will sell premium digital marketing services (SEO, PPC, Web Design, Social Media) to small and medium businesses.

What You Get:
- Pre-qualified leads delivered daily
- PowerDial auto-dialer system
- AI-powered sales coaching (Steve)
- $695/month platform access includes everything
- 30% commission on all closed deals
- Average deal size: $4,500 - $15,000

Requirements:
- Sales experience preferred
- Self-motivated and coachable
- Reliable internet and phone
- Coachable mindset

Apply now and start closing deals within 48 hours of approval.`
    setJobDescription(template)
    info('AI-generated job description ready')
  }

  // ─── RENDER ──────────────────────────────────────────────────────

  return (
    <div className="space-y-5 min-h-[calc(100vh-4rem)]">
      {/* Header with Zara */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 rounded-xl bg-card/80 border border-border/40 backdrop-blur-sm"
      >
        <img src="/avatar-zara.jpg" alt="Zara" className="w-12 h-12 rounded-xl object-cover border-2 border-amber-400/30 shadow-lg shadow-amber-400/10" />
        <div className="flex-1">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4 text-amber-400" />
            Zara Workforce Command Center
          </h2>
          <p className="text-[11px] text-muted-foreground">Recruitment + Workforce Automation Director for STARZ-OS</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-amber-400 font-medium">AI Active</span>
          </div>
          <Button size="sm" className="h-8 text-[11px] bg-amber-500/10 text-amber-400 border border-amber/20 hover:bg-amber-500/20">
            <RefreshCw className="w-3 h-3 mr-1" /> Sync Data
          </Button>
        </div>
      </motion.div>

      {/* Orbital Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="p-3 rounded-xl bg-card/60 border border-border/30 hover:border-amber/20 transition-all"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-lg font-bold ${m.color}`}>
                {m.label === 'MRR' ? `$${m.value.toLocaleString()}` : <AnimatedCounter end={m.value} />}
              </span>
              <span className={`text-[10px] ${m.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {m.change >= 0 ? '+' : ''}{m.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Visual */}
      <div className="flex items-center gap-1 p-3 rounded-xl bg-card/40 border border-border/30">
        {pipelineStages.map((stage, si) => (
          <div key={stage.label} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-2 rounded-full ${stage.color} relative`}>
              <div className={`absolute inset-0 rounded-full ${stage.color} opacity-50`} style={{ width: `${Math.min(100, (stage.count / 15) * 100)}%` }} />
            </div>
            <span className="text-[9px] text-muted-foreground">{stage.label}</span>
            <span className={`text-xs font-bold ${stage.color.replace('bg-', 'text-')}`}>{stage.count}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-card/60 border border-border/40 p-1 h-9 flex-wrap h-auto">
          <TabsTrigger value="overview" className="text-[11px] gap-1 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
            <Activity className="w-3 h-3" /> Overview
          </TabsTrigger>
          <TabsTrigger value="applicants" className="text-[11px] gap-1 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
            <Users className="w-3 h-3" /> Applicants ({filteredApplicants.length})
          </TabsTrigger>
          <TabsTrigger value="jobs" className="text-[11px] gap-1 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
            <Globe className="w-3 h-3" /> Job Posting
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="text-[11px] gap-1 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
            <CheckCircle2 className="w-3 h-3" /> Onboarding
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-[11px] gap-1 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
            <CreditCard className="w-3 h-3" /> Subscriptions
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-[11px] gap-1 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
            <BarChart3 className="w-3 h-3" /> Performance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-[11px] gap-1 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
            <Radio className="w-3 h-3" /> Live Feed
          </TabsTrigger>
          <TabsTrigger value="training" className="text-[11px] gap-1 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
            <GraduationCap className="w-3 h-3" /> Training
          </TabsTrigger>
          <TabsTrigger value="security" className="text-[11px] gap-1 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
            <Shield className="w-3 h-3" /> Security
          </TabsTrigger>
        </TabsList>

        {/* ─── OVERVIEW TAB ─── */}
        <TabsContent value="overview" className="mt-3 space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Recent Hires */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-card/60 border border-border/40">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                <UserCheck className="w-4 h-4 text-amber-400" /> Recent Activations
              </h3>
              <div className="space-y-2">
                {applicants.filter(a => a.status === 'active').slice(0, 6).map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-space-highlight/20 hover:bg-space-highlight/30 transition-all cursor-pointer"
                    onClick={() => { setSelectedApplicant(a.id); setActiveTab('applicants') }}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={a.avatar} />
                      <AvatarFallback className="text-[10px] bg-amber-500/10 text-amber-400">{a.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">{a.name}</span>
                        <Badge className="text-[9px] h-4 px-1 bg-amber-500/10 text-amber-400 border-0">{a.role}</Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{a.city} {a.state} &middot; {a.source}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-emerald-400">${a.revenueGenerated?.toLocaleString()}</div>
                      <div className="text-[9px] text-muted-foreground">{a.closeRate}% close</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Regional Heatmap placeholder + Quick Stats */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-card/60 border border-border/40">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                  <MapPin className="w-4 h-4 text-amber-400" /> Regional Distribution
                </h3>
                <div className="space-y-2">
                  {['GA', 'TX', 'FL', 'NY', 'CA'].map((state, i) => {
                    const count = applicants.filter(a => a.state === state).length
                    const pct = Math.round((count / applicants.length) * 100)
                    return (
                      <div key={state} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-6">{state}</span>
                        <div className="flex-1 h-2 bg-space-highlight rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-medium text-foreground w-5 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card/60 border border-border/40">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
                  <Rocket className="w-4 h-4 text-amber-400" /> Activation Speed
                </h3>
                <div className="text-center py-2">
                  <span className="text-3xl font-bold text-amber-400">18</span>
                  <span className="text-xs text-muted-foreground ml-1">min avg</span>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">Paid to Activated</p>
                <Progress value={92} className="h-1.5 mt-2" />
                <p className="text-[9px] text-muted-foreground text-center mt-1">92% within 30 minutes</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── APPLICANTS TAB ─── */}
        <TabsContent value="applicants" className="mt-3 space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-card/60 border border-border/40">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Filter className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Filters:</span>
            </div>
            <Input
              placeholder="Search by name, email, city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-7 text-[11px] bg-space-highlight/20 border-border/40 w-52"
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-7 text-[11px] bg-space-highlight/20 border border-border/40 rounded-md px-2 text-foreground outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="approved">Approved</option>
              <option value="onboarding">Onboarding</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="churned">Churned</option>
              <option value="past_due">Past Due</option>
            </select>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="h-7 text-[11px] bg-space-highlight/20 border border-border/40 rounded-md px-2 text-foreground outline-none"
            >
              <option value="all">All Roles</option>
              <option value="BGE Contractor">BGE Contractor</option>
              <option value="Sales Rep">Sales Rep</option>
              <option value="SEO Specialist">SEO Specialist</option>
              <option value="Developer">Developer</option>
              <option value="Ads Specialist">Ads Specialist</option>
              <option value="Closer">Closer</option>
              <option value="Appointment Setter">Appointment Setter</option>
            </select>
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            {/* Applicant List */}
            <div className="lg:col-span-2 space-y-2">
              <ScrollArea className="h-[calc(100vh-20rem)]">
                {filteredApplicants.map((a, i) => {
                  const cfg = statusConfig[a.status] || statusConfig.new
                  const StatusIcon = cfg.icon
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedApplicant(a.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border mb-2 cursor-pointer transition-all ${
                        selectedApplicant === a.id
                          ? 'bg-amber-500/5 border-amber/30'
                          : 'bg-card/40 border-border/30 hover:border-border/50'
                      }`}
                    >
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={a.avatar} />
                        <AvatarFallback className="text-[10px] bg-amber-500/10 text-amber-400">{a.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">{a.name}</span>
                          <Badge className={`text-[9px] h-4 px-1 ${cfg.bg} ${cfg.color} border-0`}>
                            <StatusIcon className="w-2.5 h-2.5 mr-0.5" /> {a.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{a.role}</span>
                          <span>{a.city} {a.state}</span>
                          <span>via {a.source}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {a.subscriptionStatus && (
                          <Badge className={`text-[9px] h-4 px-1 ${subConfig[a.subscriptionStatus]?.bg || ''} ${subConfig[a.subscriptionStatus]?.color || ''} border-0`}>
                            {a.subscriptionStatus}
                          </Badge>
                        )}
                        <p className="text-[9px] text-muted-foreground mt-0.5">{a.appliedDate}</p>
                      </div>
                      {['new', 'screening', 'interview', 'approved', 'onboarding'].includes(a.status) && (
                        <Button
                          size="sm"
                          className="h-7 text-[10px] bg-amber-500/10 text-amber-400 border border-amber/20 hover:bg-amber-500/20 shrink-0"
                          onClick={(e) => { e.stopPropagation(); advanceApplicant(a.id) }}
                        >
                          <ChevronRight className="w-3 h-3" /> Advance
                        </Button>
                      )}
                    </motion.div>
                  )
                })}
              </ScrollArea>
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-1">
              <AnimatePresence mode="wait">
                {selected && (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded-xl bg-card/60 border border-border/40 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={selected.avatar} />
                        <AvatarFallback className="text-sm bg-amber-500/10 text-amber-400">{selected.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{selected.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{selected.id} &middot; {selected.role}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-lg bg-space-highlight/20">
                        <Mail className="w-3 h-3 text-muted-foreground mb-1" />
                        <p className="text-muted-foreground">Email</p>
                        <p className="text-foreground truncate">{selected.email}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-space-highlight/20">
                        <Phone className="w-3 h-3 text-muted-foreground mb-1" />
                        <p className="text-muted-foreground">Phone</p>
                        <p className="text-foreground">{selected.phone}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-space-highlight/20">
                        <MapPin className="w-3 h-3 text-muted-foreground mb-1" />
                        <p className="text-muted-foreground">Location</p>
                        <p className="text-foreground">{selected.city} {selected.state}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-space-highlight/20">
                        <Globe className="w-3 h-3 text-muted-foreground mb-1" />
                        <p className="text-muted-foreground">Source</p>
                        <p className="text-foreground">{selected.source}</p>
                      </div>
                    </div>

                    {selected.closeRate && (
                      <div className="p-2 rounded-lg bg-space-highlight/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">Close Rate</span>
                          <span className="text-xs font-bold text-emerald-400">{selected.closeRate}%</span>
                        </div>
                        <Progress value={selected.closeRate} className="h-1.5" />
                      </div>
                    )}

                    {selected.revenueGenerated !== undefined && (
                      <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald/10">
                        <p className="text-[10px] text-muted-foreground">Revenue Generated</p>
                        <p className="text-lg font-bold text-emerald-400">${selected.revenueGenerated.toLocaleString()}</p>
                      </div>
                    )}

                    {/* Onboarding Progress */}
                    {selected.onboardingProgress > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">Onboarding Progress</span>
                          <span className="text-[10px] font-bold text-amber-400">{selected.onboardingProgress}%</span>
                        </div>
                        <Progress value={selected.onboardingProgress} className="h-1.5" />
                      </div>
                    )}

                    {/* Subscription Actions */}
                    {selected.subscriptionStatus === 'past_due' && (
                      <Button size="sm" variant="destructive" className="h-7 text-[10px] w-full">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Suspend Account
                      </Button>
                    )}
                    {selected.status === 'approved' && (
                      <Button size="sm" className="h-7 text-[10px] bg-amber-500/10 text-amber-400 border border-amber/20 hover:bg-amber-500/20 w-full"
                        onClick={() => advanceApplicant(selected.id)}>
                        <Zap className="w-3 h-3 mr-1" /> Start Onboarding
                      </Button>
                    )}
                  </motion.div>
                )}
                {!selected && (
                  <div className="p-4 rounded-xl bg-card/40 border border-border/20 flex flex-col items-center justify-center h-48 text-center">
                    <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Select an applicant to view details</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        {/* ─── JOB POSTING TAB ─── */}
        <TabsContent value="jobs" className="mt-3 space-y-4">
          {/* Job Posting Engine */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Create Job Post */}
            <div className="p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Send className="w-4 h-4 text-amber-400" /> Multi-Platform Job Posting
              </h3>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Job Title</label>
                  <Input placeholder="e.g. BGE Contractor - Business Growth Expert" className="h-8 text-xs bg-space-highlight/20 border-border/40" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Role Type</label>
                    <select className="h-8 text-[11px] w-full bg-space-highlight/20 border border-border/40 rounded-md px-2 text-foreground outline-none">
                      <option>BGE Contractor</option>
                      <option>Sales Rep</option>
                      <option>SEO Specialist</option>
                      <option>Developer</option>
                      <option>Ads Specialist</option>
                      <option>Closer</option>
                      <option>Appointment Setter</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Location</label>
                    <Input placeholder="Remote or City, State" className="h-8 text-xs bg-space-highlight/20 border-border/40" />
                  </div>
                </div>

                {/* AI Job Description Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-muted-foreground">Job Description</label>
                    <Button size="sm" variant="ghost" className="h-5 text-[9px] text-amber-400 hover:text-amber-300" onClick={generateJobDescription}>
                      <Brain className="w-2.5 h-2.5 mr-1" /> AI Generate
                    </Button>
                  </div>
                  <textarea
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    placeholder="Click 'AI Generate' to create an optimized job description..."
                    className="w-full h-36 text-[11px] bg-space-highlight/20 border border-border/40 rounded-md p-2.5 text-foreground outline-none resize-none"
                  />
                </div>

                {/* Platform Selector */}
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1.5 block">Post to Platforms</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['LinkedIn Jobs', 'Indeed', 'Craigslist', 'Monster', 'ZipRecruiter', 'Glassdoor'].map(platform => (
                      <label key={platform} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-space-highlight/20 cursor-pointer hover:bg-space-highlight/30 transition-all">
                        <input
                          type="checkbox"
                          checked={selectedJobPlatforms.includes(platform)}
                          onChange={e => {
                            if (e.target.checked) setSelectedJobPlatforms([...selectedJobPlatforms, platform])
                            else setSelectedJobPlatforms(selectedJobPlatforms.filter(p => p !== platform))
                          }}
                          className="w-3 h-3 rounded accent-amber-400"
                        />
                        <span className="text-[10px] text-foreground">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button className="w-full h-8 text-[11px] bg-amber-500/10 text-amber-400 border border-amber/20 hover:bg-amber-500/20" onClick={() => {
                  success(`Job posted to ${selectedJobPlatforms.length} platforms`)
                  setJobDescription('')
                }}>
                  <Rocket className="w-3.5 h-3.5 mr-1" /> Publish to {selectedJobPlatforms.length} Platforms
                </Button>
              </div>
            </div>

            {/* Active Job Listings */}
            <div className="p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" /> Active Listings ({jobs.length})
              </h3>
              <ScrollArea className="h-[calc(100vh-18rem)]">
                <div className="space-y-2">
                  {jobs.map((job, i) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-3 rounded-lg bg-space-highlight/20 border border-border/20 hover:border-amber/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{job.title}</p>
                          <p className="text-[10px] text-muted-foreground">{job.platform} &middot; {job.location}</p>
                        </div>
                        <Badge className={`text-[9px] h-4 px-1 border-0 ${
                          job.status === 'live' ? 'bg-emerald-500/10 text-emerald-400' :
                          job.status === 'paused' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {job.status === 'live' && <span className="w-1 h-1 rounded-full bg-emerald-400 mr-1" />}
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.applicants} applicants</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" /> ROI {job.roi}x</span>
                        <span>{job.postedDate}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        {/* ─── ONBOARDING TAB ─── */}
        <TabsContent value="onboarding" className="mt-3 space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Contractors in Onboarding */}
            <div className="lg:col-span-1 p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> In Onboarding
              </h3>
              <div className="space-y-2">
                {applicants.filter(a => a.status === 'onboarding').map(a => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedApplicant(a.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                      selectedApplicant === a.id ? 'bg-amber-500/5 border border-amber/20' : 'bg-space-highlight/20 hover:bg-space-highlight/30'
                    }`}
                  >
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={a.avatar} />
                      <AvatarFallback className="text-[9px] bg-amber-500/10 text-amber-400">{a.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground">{a.name}</p>
                      <Progress value={a.onboardingProgress} className="h-1 mt-0.5" />
                    </div>
                    <span className="text-[10px] text-amber-400 font-medium">{a.onboardingProgress}%</span>
                  </div>
                ))}
                {applicants.filter(a => a.status === 'onboarding').length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-4">No contractors in onboarding</p>
                )}
              </div>
            </div>

            {/* Onboarding Checklist Detail */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> Onboarding Pipeline
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {selected ? `Showing checklist for ${selected.name}` : 'Select a contractor to view their onboarding progress'}
              </p>
              <div className="space-y-1.5">
                {(selected ? getOnboardingSteps(selected.onboardingProgress) : ONBOARDING_TEMPLATE).map((step, i) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border-l-2 ${
                      step.completed ? 'border-l-emerald-400 bg-emerald-500/5' : 'border-l-amber-400 bg-amber-500/5'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      step.completed ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                    }`}>
                      {step.completed ? <Check className="w-3 h-3 text-emerald-400" /> : <CircleDot className="w-3 h-3 text-amber-400" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[11px] ${step.completed ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                        {step.label}
                      </p>
                    </div>
                    {step.required && <Badge className="text-[8px] h-3.5 px-1 bg-red-500/10 text-red-400 border-0">required</Badge>}
                    {step.completionDate && <span className="text-[9px] text-emerald-400">{step.completionDate}</span>}
                  </motion.div>
                ))}
              </div>

              {/* Auto-Provisioning Preview */}
              {selected && selected.onboardingProgress >= 30 && (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald/10 space-y-2">
                  <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Rocket className="w-3.5 h-3.5" /> Auto-Provisioning Status
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { label: 'STARZ-OS Account', status: true, icon: Monitor },
                      { label: 'Email (@traffikboosters.com)', status: selected.onboardingProgress >= 40, icon: Mail },
                      { label: 'Contractor ID', status: true, icon: FileText },
                      { label: 'PowerDial Access', status: selected.onboardingProgress >= 60, icon: Phone },
                      { label: 'Lead Pool Eligibility', status: selected.onboardingProgress >= 80, icon: Target },
                      { label: 'VOX Chat', status: selected.onboardingProgress >= 50, icon: MessageSquare },
                      { label: 'Commission Dashboard', status: selected.onboardingProgress >= 70, icon: DollarSign },
                      { label: 'KPI Dashboard', status: selected.onboardingProgress >= 90, icon: BarChart3 },
                    ].map((item, ii) => (
                      <div key={ii} className="flex items-center gap-1.5 p-1.5 rounded bg-card/40">
                        <item.icon className={`w-3 h-3 ${item.status ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                        <span className={item.status ? 'text-emerald-400' : 'text-muted-foreground'}>{item.label}</span>
                        {item.status ? <Check className="w-3 h-3 text-emerald-400 ml-auto" /> : <Clock className="w-3 h-3 text-amber-400 ml-auto" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Paid → Activated in Minutes Flow */}
          <div className="p-4 rounded-xl bg-card/60 border border-amber/20 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" /> Paid → Activated in Minutes
            </h3>
            <p className="text-[10px] text-muted-foreground">A contractor pays $695/month and receives full access within minutes. Automation pipeline:</p>
            <div className="flex items-center gap-1">
              {[
                { label: 'Payment', desc: 'Stripe confirms', icon: CreditCard, color: 'bg-emerald-500' },
                { label: 'Account', desc: 'STARZ-OS created', icon: UserCheck, color: 'bg-emerald-500' },
                { label: 'Email', desc: '@traffikboosters.com', icon: Mail, color: 'bg-emerald-500' },
                { label: 'ID', desc: 'Contractor ID gen', icon: FileText, color: 'bg-emerald-400' },
                { label: 'PowerDial', desc: 'Auto-provisioned', icon: Phone, color: 'bg-emerald-400' },
                { label: 'VOX', desc: 'Chat activated', icon: MessageSquare, color: 'bg-emerald-400' },
                { label: 'Leads', desc: 'Pool eligibility', icon: Target, color: 'bg-cyan-500' },
                { label: 'Done', desc: 'Ready to close', icon: CheckCircle2, color: 'bg-cyan-500' },
              ].map((step, si) => (
                <div key={si} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full h-8 rounded-md ${step.color} flex items-center justify-center`}>
                    <step.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[8px] text-foreground font-medium text-center leading-tight">{step.label}</span>
                  <span className="text-[7px] text-muted-foreground text-center leading-tight">{step.desc}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/5 border border-emerald/10">
                <Timer className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">18 min average activation</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan/5 border border-cyan/10">
                <CheckCircle2 className="w-3 h-3 text-cyan" />
                <span className="text-[10px] text-cyan font-medium">92% within 30 minutes</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── SUBSCRIPTIONS TAB ─── */}
        <TabsContent value="subscriptions" className="mt-3 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Active ($695/mo)', value: activeSubs, total: activeSubs * 695, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Trial', value: trialSubs, total: 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Past Due', value: applicants.filter(a => a.subscriptionStatus === 'past_due').length, total: 0, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Cancelled', value: applicants.filter(a => a.subscriptionStatus === 'cancelled').length, total: 0, color: 'text-muted-foreground', bg: 'bg-muted' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-xl ${s.bg} border border-border/30`}>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                {s.total > 0 && <p className="text-[10px] text-muted-foreground">${s.total.toLocaleString()}/mo</p>}
              </motion.div>
            ))}
          </div>

          {/* Subscription Detail Table */}
          <div className="p-4 rounded-xl bg-card/60 border border-border/40">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <CreditCard className="w-4 h-4 text-amber-400" /> Contractor Subscription Details
            </h3>
            <div className="space-y-2">
              {applicants.filter(a => a.subscriptionStatus).map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-space-highlight/20 hover:bg-space-highlight/30 transition-all"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={a.avatar} />
                    <AvatarFallback className="text-[9px] bg-amber-500/10 text-amber-400">{a.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{a.name}</p>
                    <p className="text-[9px] text-muted-foreground">{a.role}</p>
                  </div>
                  <Badge className={`text-[9px] h-4 px-1 border-0 ${subConfig[a.subscriptionStatus!]?.bg || ''} ${subConfig[a.subscriptionStatus!]?.color || ''}`}>
                    {a.subscriptionStatus}
                  </Badge>
                  <div className="text-right shrink-0">
                    {a.subscriptionStatus === 'active' && (
                      <p className="text-xs font-medium text-emerald-400">$695/mo</p>
                    )}
                    {a.subscriptionStatus === 'trial' && (
                      <p className="text-xs font-medium text-amber-400">Trial</p>
                    )}
                    {a.subscriptionStatus === 'past_due' && (
                      <Button size="sm" variant="destructive" className="h-6 text-[9px]" onClick={() => {
                        setApplicants(prev => prev.map(x => x.id === a.id ? { ...x, subscriptionStatus: 'suspended' as const } : x))
                        info(`${a.name} account suspended`)
                      }}>
                        Suspend
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ─── PERFORMANCE TAB ─── */}
        <TabsContent value="performance" className="mt-3 space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Performance Leaderboard */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" /> Workforce Performance
              </h3>
              <div className="space-y-2">
                {applicants
                  .filter(a => a.status === 'active')
                  .sort((a, b) => (b.revenueGenerated || 0) - (a.revenueGenerated || 0))
                  .map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-space-highlight/20"
                    >
                      <span className={`text-xs font-bold w-5 text-center ${i < 3 ? 'text-amber-400' : 'text-muted-foreground'}`}>{i + 1}</span>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={a.avatar} />
                        <AvatarFallback className="text-[10px] bg-amber-500/10 text-amber-400">{a.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{a.name}</p>
                        <p className="text-[9px] text-muted-foreground">{a.role} &middot; {a.city} {a.state}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-3 text-[10px]">
                          <div>
                            <p className="text-muted-foreground">Close Rate</p>
                            <p className="font-semibold text-foreground">{a.closeRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Revenue</p>
                            <p className="font-semibold text-emerald-400">${(a.revenueGenerated || 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="w-20">
                        <Progress value={a.closeRate} className="h-1" />
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* Risk Alerts */}
            <div className="p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400" /> Risk Alerts
              </h3>
              <div className="space-y-2">
                {applicants
                  .filter(a => a.status === 'past_due' || a.status === 'churned' || (a.closeRate && a.closeRate < 35))
                  .map(a => (
                    <div key={a.id} className="p-2.5 rounded-lg bg-red-500/5 border border-red/10">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span className="text-[11px] font-medium text-foreground">{a.name}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">
                        {a.subscriptionStatus === 'past_due' ? 'Payment 5+ days past due' :
                         a.status === 'churned' ? `Churned - only ${a.closeRate}% close rate` :
                         `Low performance - ${a.closeRate}% close rate`}
                      </p>
                      {a.subscriptionStatus === 'past_due' && (
                        <div className="flex gap-1 mt-1.5">
                          <Button size="sm" className="h-5 text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald/20 hover:bg-emerald-500/20">Send Reminder</Button>
                          <Button size="sm" variant="destructive" className="h-5 text-[8px]">Suspend</Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Quick Stats */}
              <div className="pt-2 border-t border-border/20">
                <p className="text-[10px] text-muted-foreground mb-2">Performance Summary</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-space-highlight/20 text-center">
                    <p className="text-lg font-bold text-foreground">{Math.round(applicants.filter(a => a.closeRate).reduce((sum, a) => sum + (a.closeRate || 0), 0) / applicants.filter(a => a.closeRate).length)}%</p>
                    <p className="text-[9px] text-muted-foreground">Avg Close Rate</p>
                  </div>
                  <div className="p-2 rounded-lg bg-space-highlight/20 text-center">
                    <p className="text-lg font-bold text-emerald-400">${(applicants.filter(a => a.revenueGenerated).reduce((sum, a) => sum + (a.revenueGenerated || 0), 0)).toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── LIVE FEED TAB ─── */}
        <TabsContent value="notifications" className="mt-3">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Live Notification Feed */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-card/60 border border-border/40">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                <Radio className="w-4 h-4 text-red-400 animate-pulse" /> Real-Time Workforce Feed
              </h3>
              <ScrollArea className="h-[calc(100vh-18rem)]">
                <div className="space-y-2">
                  {NOTIFICATIONS.map((n, i) => {
                    const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
                      application: { icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      payment: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      onboarding: { icon: CheckCircle2, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                      alert: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
                      completion: { icon: Award, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                    }
                    const tc = typeConfig[n.type]
                    const TypeIcon = tc.icon
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-space-highlight/20 hover:bg-space-highlight/30 transition-all"
                      >
                        <div className={`w-7 h-7 rounded-lg ${tc.bg} flex items-center justify-center shrink-0`}>
                          <TypeIcon className={`w-3.5 h-3.5 ${tc.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] text-foreground">{n.message}</p>
                          <p className="text-[9px] text-muted-foreground">{n.time}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Quick Actions */}
            <div className="p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Quick Actions
              </h3>
              <div className="space-y-1.5">
                {[
                  { label: 'Send Interview Invite', icon: Calendar, desc: 'To pending candidates' },
                  { label: 'Payment Reminder', icon: Mail, desc: 'Past due accounts' },
                  { label: 'Trial Ending Notice', icon: Clock, desc: '3-day warning' },
                  { label: 'Performance Coaching', icon: Target, desc: 'Low close rate reps' },
                  { label: 'Reactivation Campaign', icon: RefreshCw, desc: 'Churned contractors' },
                  { label: 'Export Report', icon: FileText, desc: 'CSV download' },
                ].map((action, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full h-auto py-2 justify-start text-left hover:bg-amber-500/5 group"
                    onClick={() => success(`${action.label} triggered`)}
                  >
                    <action.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-400 mr-2 shrink-0" />
                    <div>
                      <p className="text-[11px] text-foreground group-hover:text-amber-400">{action.label}</p>
                      <p className="text-[9px] text-muted-foreground">{action.desc}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── TRAINING & CERTIFICATION TAB ─── */}
        <TabsContent value="training" className="mt-3 space-y-4">
          {/* Training Modules */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-400" /> Training Modules
              </h3>
              <div className="space-y-2">
                {TRAINING_MODULES.map((mod, i) => (
                  <motion.div key={mod.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-space-highlight/20 hover:bg-space-highlight/30 transition-all">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${mod.required ? 'bg-amber-500/10' : 'bg-cyan/10'}`}>
                      <GraduationCap className={`w-3.5 h-3.5 ${mod.required ? 'text-amber-400' : 'text-cyan'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-foreground">{mod.title}</span>
                        {mod.required && <Badge className="text-[7px] h-3 px-0.5 bg-red-500/10 text-red-400 border-0">required</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span>{mod.duration}</span>
                        <span>Avg: {mod.avgScore}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-space-highlight rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${(mod.completed/mod.total) > 0.8 ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${(mod.completed/mod.total)*100}%` }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground">{mod.completed}/{mod.total}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Certification Status */}
            <div className="p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" /> Certification Status
              </h3>
              <div className="space-y-2">
                {CERTIFICATIONS.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border-l-2 transition-all ${
                      c.certified ? 'border-l-emerald-400 bg-emerald-500/5' : 'border-l-amber-400 bg-amber-500/5'
                    }`}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={c.avatar} />
                      <AvatarFallback className="text-[10px] bg-amber-500/10 text-amber-400">{c.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{c.name}</p>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span>{c.modulesDone}/{c.totalModules} modules</span>
                        <span>Quiz: {c.quizAvg}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {c.certified ? (
                        <Badge className="text-[9px] h-4 px-1 bg-emerald-500/10 text-emerald-400 border-0">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Certified
                        </Badge>
                      ) : (
                        <Badge className="text-[9px] h-4 px-1 bg-amber-500/10 text-amber-400 border-0">
                          <Clock className="w-2.5 h-2.5 mr-0.5" /> In Progress
                        </Badge>
                      )}
                    </div>
                    <div className="shrink-0">
                      {c.readyForLeads ? (
                        <span className="text-[9px] text-emerald-400">Ready</span>
                      ) : (
                        <span className="text-[9px] text-amber-400">Not Ready</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Live Readiness Summary */}
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald/10">
                <p className="text-[11px] font-semibold text-emerald-400 mb-1">
                  {CERTIFICATIONS.filter(c => c.readyForLeads).length} of {CERTIFICATIONS.length} contractors ready for live leads
                </p>
                <Progress value={(CERTIFICATIONS.filter(c => c.readyForLeads).length / CERTIFICATIONS.length) * 100} className="h-1.5" />
                <p className="text-[9px] text-muted-foreground mt-1">
                  {CERTIFICATIONS.filter(c => !c.readyForLeads).length} contractors still in training
                </p>
              </div>
            </div>
          </div>

          {/* Email Automation Layer */}
          <div className="p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-amber-400" /> Email Automation Layer
            </h3>
            <div className="space-y-2">
              {EMAIL_TEMPLATES.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-space-highlight/20 hover:bg-space-highlight/30 transition-all">
                  <div className={`w-7 h-7 rounded-lg ${t.status === 'active' ? 'bg-emerald-500/10' : 'bg-muted'} flex items-center justify-center shrink-0`}>
                    <Send className={`w-3.5 h-3.5 ${t.status === 'active' ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground">{t.name}</p>
                    <p className="text-[9px] text-muted-foreground">Trigger: {t.trigger}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-foreground">{t.sent} sent</p>
                    <p className="text-[9px] text-emerald-400">{t.openRate}% open</p>
                  </div>
                  <Badge className={`text-[8px] h-3.5 px-1 border-0 ${t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>{t.status}</Badge>
                  <button onClick={() => success(`${t.name} toggled`)} className={`w-7 h-3.5 rounded-full relative ${t.status === 'active' ? 'bg-emerald-500/30' : 'bg-muted'}`}>
                    <span className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${t.status === 'active' ? 'right-0.5 bg-emerald-400' : 'left-0.5 bg-muted-foreground'}`} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ─── SECURITY & ACCESS TAB ─── */}
        <TabsContent value="security" className="mt-3 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Access Policies */}
            <div className="p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" /> Access & Security Policies
              </h3>
              <p className="text-[10px] text-muted-foreground">Integrated with Sentinel — auto-suspend on payment failure, role-based access, offboarding automation</p>
              <div className="space-y-2">
                {ACCESS_POLICIES.map((p, i) => (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-space-highlight/20">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {p.status ? <Lock className="w-3 h-3 text-emerald-400" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
                        <span className="text-[11px] font-medium text-foreground">{p.name}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground ml-4">{p.description}</p>
                    </div>
                    <button onClick={() => success(`Policy toggled`)} className={`w-8 h-4 rounded-full relative shrink-0 ${p.status ? 'bg-emerald-500/30' : 'bg-muted'}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${p.status ? 'right-0.5 bg-emerald-400' : 'left-0.5 bg-muted-foreground'}`} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Security Logs */}
            <div className="p-4 rounded-xl bg-card/60 border border-border/40 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-400" /> Security Event Log
              </h3>
              <div className="space-y-2">
                {SECURITY_LOGS.map((s, i) => (
                  <motion.div key={s.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border-l-2 ${
                      s.severity === 'high' ? 'border-l-red-400 bg-red-500/5' : s.severity === 'medium' ? 'border-l-amber-400 bg-amber-500/5' : 'border-l-emerald-400 bg-emerald-500/5'
                    }`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      s.severity === 'high' ? 'bg-red-500/20' : s.severity === 'medium' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                    }`}>
                      {s.severity === 'high' ? <AlertTriangle className="w-3 h-3 text-red-400" /> : s.severity === 'medium' ? <AlertCircle className="w-3 h-3 text-amber-400" /> : <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-foreground">{s.action}</span>
                        <span className={`text-[8px] px-1 rounded ${s.severity === 'high' ? 'text-red-400 bg-red-500/10' : s.severity === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>{s.severity}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">{s.target} — {s.reason}</p>
                      <p className="text-[8px] text-muted-foreground">{s.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Auto-Suspend Preview */}
          <div className="p-4 rounded-xl bg-card/60 border border-border/40">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <Ban className="w-4 h-4 text-red-400" /> Auto-Suspend Triggers
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Payment fails 2x', action: 'Suspend PowerDial', color: 'text-red-400' },
                { label: 'Trial expires', action: 'Pause lead access', color: 'text-amber-400' },
                { label: 'Churn 30 days', action: 'Auto-offboard', color: 'text-red-400' },
                { label: 'Cert incomplete', action: 'No live leads', color: 'text-amber-400' },
              ].map((t, i) => (
                <div key={i} className="p-2 rounded-lg bg-space-highlight/20 text-center">
                  <p className="text-[9px] text-muted-foreground">If</p>
                  <p className="text-[10px] font-medium text-foreground">{t.label}</p>
                  <p className="text-[9px] text-muted-foreground">→</p>
                  <p className={`text-[10px] font-medium ${t.color}`}>{t.action}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


