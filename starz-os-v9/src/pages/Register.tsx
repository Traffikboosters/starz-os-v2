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

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const navigate = useNavigate()
  const { success } = useToast()

  const validate = () => {
    const e: { name?: string; email?: string; password?: string } = {}
    if (!name.trim()) e.name = 'Full name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Minimum 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      success('Account created! Welcome to STARZ-OS.')
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
              "Join thousands of teams who have already made the switch. The onboarding took us less than a day."
            </blockquote>
            <p className="text-sm text-cyan font-medium">Marcus Webb, Lead Developer at DataFlow</p>
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
            <h1 className="text-2xl font-bold text-foreground mb-2">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start your 14-day free trial today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-foreground">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
                className={`bg-card border ${errors.name ? 'border-red-500' : 'border-border/50'} focus:border-cyan/50 focus:ring-cyan/20`}
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
            </div>

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
                  placeholder="Create a strong password"
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

            <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-border bg-card text-cyan focus:ring-cyan"
              />
              <span>
                I agree to the <a href="#" className="text-cyan hover:text-cyan/80">Terms of Service</a> and{' '}
                <a href="#" className="text-cyan hover:text-cyan/80">Privacy Policy</a>
              </span>
            </label>

            <Button
              type="submit"
              disabled={loading || !agreed}
              className="w-full bg-gradient-primary text-space font-bold hover:opacity-90 glow-cyan disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan hover:text-cyan/80 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
