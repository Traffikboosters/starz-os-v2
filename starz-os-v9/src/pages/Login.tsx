import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string|null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Dev bypass — remove in production
  const devBypass = () => navigate('/dashboard')

  return (
    <div className="min-h-screen bg-space flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-space-highlight to-space-surface">
        <div className="relative z-10 flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <Star className="w-6 h-6 text-cyan fill-cyan" />
            <span className="text-xl font-bold text-white">STARZ<span className="text-cyan">-OS</span></span>
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Orbital Command Center</h2>
            <p className="text-white/60 text-sm">The AI-powered operating system for Traffik Boosters. Steve, Rico, and your entire revenue engine — unified.</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
          className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your STARZ-OS account</p>
          </div>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
              <Input id="email" type="email" placeholder="traffikboosters@gmail.com" value={email}
                onChange={e=>setEmail(e.target.value)} className="bg-card border-border/50" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword?"text":"password"} placeholder="Enter your password"
                  value={password} onChange={e=>setPassword(e.target.value)}
                  className="bg-card border-border/50 pr-10" required />
                <button type="button" onClick={()=>setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary text-space font-bold hover:opacity-90">
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <>Sign In <ArrowRight className="ml-2 w-4 h-4"/></>}
            </Button>
          </form>
          <button onClick={devBypass} className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
            → Dev bypass (go to dashboard)
          </button>
        </motion.div>
      </div>
    </div>
  )
}
