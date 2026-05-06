import { Routes, Route } from 'react-router'
import { Suspense, lazy } from 'react'
import { StarField } from '@/components/StarField'
import { Layout } from '@/components/Layout'

// ─── SALES DIVISION ─────────────────────────────────────────────────
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Leads = lazy(() => import('@/pages/Leads'))
const PowerDial = lazy(() => import('@/pages/PowerDial'))
const Outreach = lazy(() => import('@/pages/Outreach'))
const Proposals = lazy(() => import('@/pages/Proposals'))
const Billing = lazy(() => import('@/pages/Billing'))
const AISteve = lazy(() => import('@/pages/AISteve'))

// ─── FULFILLMENT DIVISION ───────────────────────────────────────────
const WorkOrders = lazy(() => import('@/pages/WorkOrders'))
const DeveloperWorkspace = lazy(() => import('@/pages/DeveloperWorkspace'))
const SeoOperations = lazy(() => import('@/pages/SeoOperations'))
const Deliverables = lazy(() => import('@/pages/Deliverables'))
const Reports = lazy(() => import('@/pages/Reports'))

// ─── SYSTEM ─────────────────────────────────────────────────────────
const CommandCenter = lazy(() => import('@/pages/CommandCenter'))
const Automation = lazy(() => import('@/pages/Automation'))
const Security = lazy(() => import('@/pages/Security'))
const Settings = lazy(() => import('@/pages/Settings'))

// ─── AUTH & LANDING ─────────────────────────────────────────────────
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </Layout>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-space">
      <StarField />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>} />

        {/* Sales Division */}
        <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/leads" element={<AppLayout><Leads /></AppLayout>} />
        <Route path="/powerdial" element={<AppLayout><PowerDial /></AppLayout>} />
        <Route path="/outreach" element={<AppLayout><Outreach /></AppLayout>} />
        <Route path="/proposals" element={<AppLayout><Proposals /></AppLayout>} />
        <Route path="/billing" element={<AppLayout><Billing /></AppLayout>} />
        <Route path="/steve" element={<AppLayout><AISteve /></AppLayout>} />

        {/* Fulfillment Division */}
        <Route path="/work-orders" element={<AppLayout><WorkOrders /></AppLayout>} />
        <Route path="/developer-workspace" element={<AppLayout><DeveloperWorkspace /></AppLayout>} />
        <Route path="/seo-operations" element={<AppLayout><SeoOperations /></AppLayout>} />
        <Route path="/deliverables" element={<AppLayout><Deliverables /></AppLayout>} />
        <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />

        {/* System */}
        <Route path="/command-center" element={<AppLayout><CommandCenter /></AppLayout>} />
        <Route path="/automation" element={<AppLayout><Automation /></AppLayout>} />
        <Route path="/security" element={<AppLayout><Security /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
      </Routes>
    </div>
  )
}
