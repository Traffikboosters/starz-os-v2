import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon, Bell, Shield, Globe, Save, RotateCcw, CheckCircle2, Phone, Mail, CreditCard, User, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useToast } from '@/hooks/useToast'

export default function BGESettings() {
  const [activeTab, setActiveTab] = useState('Profile')
  const { success, info } = useToast()

  // Profile
  const [fullName, setFullName] = useLocalStorage('starz-bge-name', 'DJ')
  const [email, setEmail] = useLocalStorage('starz-bge-email', 'dj@starz-os.com')
  const [phone, setPhone] = useLocalStorage('starz-bge-phone', '(305) 555-0100')

  // Notifications
  const [emailAlerts, setEmailAlerts] = useLocalStorage('starz-bge-email-alerts', true)
  const [smsAlerts, setSmsAlerts] = useLocalStorage('starz-bge-sms-alerts', true)
  const [newLeadAlerts, setNewLeadAlerts] = useLocalStorage('starz-bge-newlead-alerts', true)
  const [commissionAlerts, setCommissionAlerts] = useLocalStorage('starz-bge-commission-alerts', true)

  // Security
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [mfaEnabled, setMfaEnabled] = useLocalStorage('starz-bge-mfa', false)

  // Banking
  const [bankName, setBankName] = useLocalStorage('starz-bge-bank', 'Chase')
  const [accountNum, setAccountNum] = useLocalStorage('starz-bge-account', '••••4521')
  const [routingNum, setRoutingNum] = useLocalStorage('starz-bge-routing', '••••7890')

  const handleSave = () => {
    success('Settings saved')
  }

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword) {
      info('Please fill both password fields')
      return
    }
    if (newPassword.length < 8) {
      info('Password must be at least 8 characters')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    success('Password updated')
  }

  const tabs = [
    { title: 'Profile', icon: User },
    { title: 'Notifications', icon: Bell },
    { title: 'Security', icon: Shield },
    { title: 'Banking', icon: CreditCard },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan" />
            Settings
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your BGE account</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={() => info('Reset to defaults')}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
          </Button>
          <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold" onClick={handleSave}>
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        <div className="space-y-1">
          {tabs.map((section) => (
            <button
              key={section.title}
              onClick={() => setActiveTab(section.title)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === section.title
                  ? 'bg-cyan/10 text-cyan border border-cyan/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card border border-transparent'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.title}
            </button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          key={activeTab}
          className="lg:col-span-3 p-6 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">{activeTab}</h3>
          <div className="space-y-5">
            {activeTab === 'Profile' && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Full Name</p></div>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-64 bg-card border-border/40 h-8 text-sm" />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Email</p></div>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-64 bg-card border-border/40 h-8 text-sm" />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Phone</p></div>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-64 bg-card border-border/40 h-8 text-sm" />
                </div>
              </>
            )}
            {activeTab === 'Notifications' && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Email alerts</p></div>
                  <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">SMS alerts</p></div>
                  <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">New lead notifications</p></div>
                  <Switch checked={newLeadAlerts} onCheckedChange={setNewLeadAlerts} />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Commission alerts</p></div>
                  <Switch checked={commissionAlerts} onCheckedChange={setCommissionAlerts} />
                </div>
              </>
            )}
            {activeTab === 'Security' && (
              <>
                <div className="py-3 border-b border-border/10">
                  <p className="text-sm font-medium text-foreground mb-2">Change Password</p>
                  <div className="space-y-2 max-w-sm">
                    <Input placeholder="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="bg-card border-border/40 h-8 text-sm" />
                    <Input placeholder="New password (min 8 chars)" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-card border-border/40 h-8 text-sm" />
                    <Button size="sm" variant="outline" className="border-cyan/30 text-cyan h-7 text-xs" onClick={handlePasswordChange}>Update Password</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Two-factor auth</p></div>
                  <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
                </div>
              </>
            )}
            {activeTab === 'Banking' && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Bank Name</p></div>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-64 bg-card border-border/40 h-8 text-sm" />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Account Number</p></div>
                  <Input value={accountNum} onChange={(e) => setAccountNum(e.target.value)} className="w-64 bg-card border-border/40 h-8 text-sm" />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Routing Number</p></div>
                  <Input value={routingNum} onChange={(e) => setRoutingNum(e.target.value)} className="w-64 bg-card border-border/40 h-8 text-sm" />
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm text-emerald-400">Payouts active — 30% commission rate</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
