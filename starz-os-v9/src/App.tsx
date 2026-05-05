import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import { AppLayout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import PowerDial from './pages/PowerDial'
import Leads from './pages/Leads'
import Billing from './pages/Billing'
import Proposals from './pages/Proposals'
import WorkOrders from './pages/WorkOrders'
import Automation from './pages/Automation'
import SEODashboard from './pages/SEODashboard'
import Security from './pages/Security'
import AISteve from './pages/AISteve'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import APIKeys from './pages/APIKeys'
import HRZara from './pages/HRZara'

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
      <Route path="/powerdial" element={<DashboardLayout><PowerDial /></DashboardLayout>} />
      <Route path="/leads" element={<DashboardLayout><Leads /></DashboardLayout>} />
      <Route path="/billing" element={<DashboardLayout><Billing /></DashboardLayout>} />
      <Route path="/proposals" element={<DashboardLayout><Proposals /></DashboardLayout>} />
      <Route path="/workorders" element={<DashboardLayout><WorkOrders /></DashboardLayout>} />
      <Route path="/automation" element={<DashboardLayout><Automation /></DashboardLayout>} />
      <Route path="/seo" element={<DashboardLayout><SEODashboard /></DashboardLayout>} />
      <Route path="/security" element={<DashboardLayout><Security /></DashboardLayout>} />
      <Route path="/ai-steve" element={<DashboardLayout><AISteve /></DashboardLayout>} />
      <Route path="/reports" element={<DashboardLayout><Reports /></DashboardLayout>} />
      <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
      <Route path="/hr" element={<DashboardLayout><HRZara /></DashboardLayout>} />`n      <Route path="/apikeys" element={<DashboardLayout><APIKeys /></DashboardLayout>} />
    </Routes>
  )
}
