import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { StarField } from '@/components/StarField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const navigate = useNavigate()
  const { success, error } = useToast()

  const validate = () => {
    const e: { email?: string; password?: string } = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'Minimum 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      success('Welcome back, DJ!')
      navigate('/dashboard')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-space flex relative">
      <StarField />
      <div className="fixed inset-0 bg-space/80 z-[5] pointer-events-none" />
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden z-10">
        <img src="/hero-cosmos-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/60 to-transparent" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded overflow-hidden">
              <img src="/logo-starz.png" alt="STARZ-OS" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-white">STARZ<span className="text-cyan">-OS</span></span>
          </Link>
          <div>
            <blockquote className="text-lg text-white/80 italic mb-4">
              "STARZ-OS has completely transformed how our team operates. The real-time analytics alone have saved us countless hours."
            </blockquote>
            <p className="text-sm text-cyan font-medium">Sarah Chen, VP Engineering at TechCorp</p>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your STARZ-OS account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
                className={`bg-card border ${errors.email ? 'border-red-500' : 'border-border/50'} focus:border-cyan/50 focus:ring-cyan/20`}
              />
              {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })) }}
                  className={`bg-card border ${errors.password ? 'border-red-500' : 'border-border/50'} focus:border-cyan/50 focus:ring-cyan/20 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="checkbox" className="rounded border-border bg-card text-cyan focus:ring-cyan" />
                Remember me
              </label>
              <a href="#" className="text-sm text-cyan hover:text-cyan/80 transition-colors">Forgot password?</a>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary text-space font-bold hover:opacity-90 glow-cyan"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-cyan hover:text-cyan/80 transition-colors font-medium">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
