import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon, Bell, Shield, Globe, Save, CheckCircle2, ChevronRight, Users, CreditCard, Palette, Smartphone, RotateCcw, AlertCircle} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const settingSections = [
  {
    title: 'General',
    icon: SettingsIcon,
    settings: [
      { label: 'Company Name', value: 'STARZ-OS Inc.', type: 'text' },
      { label: 'Timezone', value: 'America/New_York', type: 'select' },
      { label: 'Currency', value: 'USD ($)', type: 'select' },
    ]},
  {
    title: 'Notifications',
    icon: Bell,
    settings: [
      { label: 'Email alerts for new leads', value: true, type: 'toggle' },
      { label: 'SMS for high-value deals', value: true, type: 'toggle' },
      { label: 'Slack webhook on closes', value: false, type: 'toggle' },
      { label: 'Daily summary report', value: true, type: 'toggle' },
    ]},
  {
    title: 'Security',
    icon: Shield,
    settings: [
      { label: 'Require MFA for admins', value: true, type: 'toggle' },
      { label: 'Session timeout (mins)', value: '30', type: 'number' },
      { label: 'IP whitelist mode', value: false, type: 'toggle' },
      { label: 'Auto-suspend after violations', value: true, type: 'toggle' },
    ]},
  {
    title: 'Integrations',
    icon: Globe,
    settings: [
      { label: 'Stripe account', value: 'Connected', type: 'status' },
      { label: 'Twilio SID', value: 'AC_••••••••••••••', type: 'text' },
      { label: 'SerpAPI key', value: '••••••••••••••', type: 'password' },
      { label: 'OpenAI API', value: 'Connected', type: 'status' },
    ]},
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('General')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan" />
            Settings
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Configure your STARZ-OS environment</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
          </Button>
          <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold">
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Sidebar Tabs */}
        <div className="space-y-1">
          {settingSections.map((section) => (
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
              <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeTab === section.title ? 'rotate-90' : ''}`} />
            </button>
          ))}
        </div>

        {/* Settings Panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          key={activeTab}
          className="lg:col-span-3 p-6 rounded-2xl bg-card border border-border/40 card-glow"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">{activeTab}</h3>
          <div className="space-y-5">
            {settingSections.find((s) => s.title === activeTab)?.settings.map((setting, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border/10 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{setting.label}</p>
                  {setting.type === 'toggle' && (
                    <p className="text-[10px] text-muted-foreground">
                      {setting.value ? 'Enabled' : 'Disabled'}
                    </p>
                  )}
                </div>
                <div>
                  {setting.type === 'text' && (
                    <Input value={setting.value as string} className="w-64 bg-card border-border/40 h-8 text-sm" readOnly />
                  )}
                  {setting.type === 'number' && (
                    <Input value={setting.value as string} type="number" className="w-24 bg-card border-border/40 h-8 text-sm" />
                  )}
                  {setting.type === 'password' && (
                    <Input value={setting.value as string} type="password" className="w-64 bg-card border-border/40 h-8 text-sm" readOnly />
                  )}
                  {setting.type === 'toggle' && (
                    <Switch checked={setting.value as boolean} />
                  )}
                  {setting.type === 'status' && (
                    <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {setting.value as string}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
