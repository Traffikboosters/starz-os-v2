import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon, Bell, Shield, Globe, Save, CheckCircle2, ChevronRight, Users, CreditCard, Palette, Smartphone, RotateCcw, AlertCircle, X} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useToast } from '@/hooks/useToast'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('General')
  const { success, info } = useToast()

  // General
  const [companyName, setCompanyName] = useLocalStorage('starz-company-name', 'STARZ-OS Inc.')
  const [timezone, setTimezone] = useLocalStorage('starz-timezone', 'America/New_York')
  const [currency, setCurrency] = useLocalStorage('starz-currency', 'USD ($)')

  // Notifications
  const [emailAlerts, setEmailAlerts] = useLocalStorage('starz-email-alerts', true)
  const [smsHighValue, setSmsHighValue] = useLocalStorage('starz-sms-highvalue', true)
  const [slackWebhook, setSlackWebhook] = useLocalStorage('starz-slack-webhook', false)
  const [dailySummary, setDailySummary] = useLocalStorage('starz-daily-summary', true)

  // Security
  const [requireMFA, setRequireMFA] = useLocalStorage('starz-require-mfa', true)
  const [sessionTimeout, setSessionTimeout] = useLocalStorage('starz-session-timeout', '30')
  const [ipWhitelist, setIpWhitelist] = useLocalStorage('starz-ip-whitelist', false)
  const [autoSuspend, setAutoSuspend] = useLocalStorage('starz-auto-suspend', true)

  // Integrations
  const [stripeAccount] = useLocalStorage('starz-stripe', 'Connected')
  const [twilioSid, setTwilioSid] = useLocalStorage('starz-twilio-sid', 'AC_••••••••••••••')
  const [serpKey, setSerpKey] = useLocalStorage('starz-serp-key', '••••••••••••••')
  const [openaiStatus] = useLocalStorage('starz-openai', 'Connected')

  const handleSave = () => {
    success('Settings saved successfully')
  }

  const handleReset = () => {
    info('Settings reset to defaults')
  }

  const tabs = [
    { title: 'General', icon: SettingsIcon },
    { title: 'Notifications', icon: Bell },
    { title: 'Security', icon: Shield },
    { title: 'Integrations', icon: Globe },
  ]

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
          <Button variant="outline" size="sm" className="border-border/40 text-xs h-8" onClick={handleReset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
          </Button>
          <Button size="sm" className="bg-gradient-primary text-space text-xs h-8 font-semibold" onClick={handleSave}>
            <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Sidebar Tabs */}
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
            {activeTab === 'General' && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Company Name</p></div>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-64 bg-card border-border/40 h-8 text-sm" />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Timezone</p></div>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-64 h-8 rounded-md bg-card border border-border/40 text-sm px-3 text-foreground">
                    <option value="America/New_York">Eastern (ET)</option>
                    <option value="America/Chicago">Central (CT)</option>
                    <option value="America/Denver">Mountain (MT)</option>
                    <option value="America/Los_Angeles">Pacific (PT)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Currency</p></div>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-64 h-8 rounded-md bg-card border border-border/40 text-sm px-3 text-foreground">
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="CAD ($)">CAD ($)</option>
                  </select>
                </div>
              </>
            )}
            {activeTab === 'Notifications' && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Email alerts for new leads</p><p className="text-[10px] text-muted-foreground">{emailAlerts ? 'Enabled' : 'Disabled'}</p></div>
                  <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">SMS for high-value deals</p><p className="text-[10px] text-muted-foreground">{smsHighValue ? 'Enabled' : 'Disabled'}</p></div>
                  <Switch checked={smsHighValue} onCheckedChange={setSmsHighValue} />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Slack webhook on closes</p><p className="text-[10px] text-muted-foreground">{slackWebhook ? 'Enabled' : 'Disabled'}</p></div>
                  <Switch checked={slackWebhook} onCheckedChange={setSlackWebhook} />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Daily summary report</p><p className="text-[10px] text-muted-foreground">{dailySummary ? 'Enabled' : 'Disabled'}</p></div>
                  <Switch checked={dailySummary} onCheckedChange={setDailySummary} />
                </div>
              </>
            )}
            {activeTab === 'Security' && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Require MFA for admins</p><p className="text-[10px] text-muted-foreground">{requireMFA ? 'Enabled' : 'Disabled'}</p></div>
                  <Switch checked={requireMFA} onCheckedChange={setRequireMFA} />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Session timeout (mins)</p></div>
                  <Input value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} type="number" className="w-24 bg-card border-border/40 h-8 text-sm" />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">IP whitelist mode</p><p className="text-[10px] text-muted-foreground">{ipWhitelist ? 'Enabled' : 'Disabled'}</p></div>
                  <Switch checked={ipWhitelist} onCheckedChange={setIpWhitelist} />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Auto-suspend after violations</p><p className="text-[10px] text-muted-foreground">{autoSuspend ? 'Enabled' : 'Disabled'}</p></div>
                  <Switch checked={autoSuspend} onCheckedChange={setAutoSuspend} />
                </div>
              </>
            )}
            {activeTab === 'Integrations' && (
              <>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Stripe account</p></div>
                  <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> {stripeAccount}</Badge>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">Twilio SID</p></div>
                  <Input value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} className="w-64 bg-card border-border/40 h-8 text-sm" />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">SerpAPI key</p></div>
                  <Input value={serpKey} onChange={(e) => setSerpKey(e.target.value)} type="password" className="w-64 bg-card border-border/40 h-8 text-sm" />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/10">
                  <div><p className="text-sm font-medium text-foreground">OpenAI API</p></div>
                  <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> {openaiStatus}</Badge>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
