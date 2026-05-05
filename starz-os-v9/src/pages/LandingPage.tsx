import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import {
  Star,
  BarChart3,
  Users,
  Shield,
  Globe,
  Code,
  Zap,
  Rocket,
  Cloud,
  CheckCircle2,
  ArrowRight,
  Play,
  Menu,
  X,
  Sparkles,
  Lock,
  Wifi,
  ChevronRight,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MagneticButton } from '@/components/MagneticButton'
import { StarField } from '@/components/StarField'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { Button } from '@/components/ui/button'

/* ─── Reusable animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  }),
}

/* ─── Navigation ─── */
function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLink = 'text-sm text-muted-foreground hover:text-foreground transition-colors duration-200'

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass border-b border-border/50 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Star className="w-6 h-6 text-cyan fill-cyan group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute inset-0 w-6 h-6 bg-cyan/30 blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              STARZ<span className="text-cyan">-OS</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className={navLink}>Features</a>
            <a href="#showcase" className={navLink}>Showcase</a>
            <a href="#pricing" className={navLink}>Pricing</a>
            <a href="#testimonials" className={navLink}>About</a>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Button>
            <MagneticButton
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-lg bg-gradient-primary text-space font-semibold text-sm glow-cyan hover:shadow-card-hover transition-shadow"
            >
              Launch Dashboard
            </MagneticButton>
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass border-t border-border"
        >
          <div className="px-4 py-4 space-y-3">
            {['features', 'showcase', 'pricing', 'testimonials'].map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="block text-sm text-muted-foreground hover:text-foreground capitalize"
                onClick={() => setMobileOpen(false)}
              >
                {id}
              </a>
            ))}
            <div className="flex items-center py-2">
              <span className="text-sm text-muted-foreground mr-2">Theme</span>
              <ThemeToggle />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => { setMobileOpen(false); navigate('/login') }}
            >
              Sign In
            </Button>
            <Button
              className="w-full bg-gradient-primary text-space font-semibold"
              onClick={() => { setMobileOpen(false); navigate('/dashboard') }}
            >
              Launch Dashboard
            </Button>
          </div>
        </motion.div>
      )}
    </nav>
  )
}

/* ─── Hero ─── */
function Hero() {
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 180])
  const opacity = useTransform(scrollY, [0, 500], [1, 0])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <StarField />
      <motion.div style={{ y: heroY, opacity }} className="absolute inset-0 z-0">
        <img
          src="/hero-cosmos-bg.jpg"
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-space/20 via-transparent to-space" />
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan/5 border border-cyan/20 text-cyan text-xs font-mono tracking-widest uppercase mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            Enterprise SaaS Platform v3.0
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-tighter leading-[0.95] mb-6">
            <span className="text-gradient text-glow">The Operating</span>
            <br />
            <span className="text-foreground">System for</span>
            <br />
            <span className="text-gradient text-glow">Modern Business</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Command your operations. Deploy with confidence.
            <br className="hidden sm:block" />
            Scale without limits.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <MagneticButton
              onClick={() => navigate('/register')}
              className="px-8 py-4 rounded-xl bg-gradient-primary text-space font-bold text-base glow-cyan hover:shadow-card-hover transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                Get Started <ArrowRight className="w-5 h-5" />
              </span>
            </MagneticButton>

            <MagneticButton
              className="px-8 py-4 rounded-xl border border-border/60 text-foreground font-medium hover:border-cyan/40 hover:bg-cyan/5 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-cyan text-cyan" /> Watch Demo
              </span>
            </MagneticButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
          className="mt-20 relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan/20 via-violet/20 to-cyan/20 rounded-2xl blur-2xl opacity-40" />
          <div className="relative animate-float">
            <img
              src="/dashboard-preview.jpg"
              alt="STARZ-OS Dashboard"
              className="w-full max-w-4xl mx-auto rounded-xl shadow-depth border border-border/40"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Trust Bar ─── */
function TrustBar() {
  const logos = ['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella', 'Massive']
  return (
    <section className="py-16 border-y border-border/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-muted-foreground uppercase tracking-[0.2em] mb-10">
          Trusted by forward-thinking teams
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-16">
          {logos.map((name) => (
            <span
              key={name}
              className="text-muted-foreground/30 font-bold text-base tracking-tight hover:text-muted-foreground/50 transition-colors duration-300 cursor-default"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Bento Features ─── */
function BentoFeatures() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const features = [
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      desc: 'Live metrics dashboards with sub-second updates and custom alerting rules. Visualize every metric that matters.',
      size: 'lg',
      image: '/feature-analytics.jpg',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      desc: 'SOC2-ready patterns with SSO, RBAC, and complete audit logging.',
      size: 'md',
      image: '/feature-security.jpg',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      desc: 'Unified workspace for cross-functional teams with real-time sync.',
      size: 'sm',
    },
    {
      icon: Globe,
      title: 'Global Infrastructure',
      desc: 'Multi-region deployments with automatic failover and edge caching.',
      size: 'sm',
    },
    {
      icon: Code,
      title: 'API-first',
      desc: 'GraphQL and REST APIs with comprehensive documentation and SDKs.',
      size: 'sm',
    },
    {
      icon: Zap,
      title: 'Auto-scaling',
      desc: 'Elastic compute from zero to millions without manual intervention.',
      size: 'md',
    },
  ]

  return (
    <section id="features" className="py-28 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeUp}
          className="text-center mb-16"
        >
          <p className="text-cyan font-mono text-xs tracking-[0.2em] uppercase mb-3">Capabilities</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Everything you need
            <br />
            <span className="text-gradient">to operate at scale</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
          {features.map((f, i) => {
            const spanClass =
              f.size === 'lg'
                ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2'
                : f.size === 'md'
                ? 'sm:col-span-2 lg:col-span-2'
                : ''

            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{
                  delay: i * 0.1,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group relative p-6 rounded-2xl bg-card border border-border/40 overflow-hidden card-glow transition-all duration-300 hover:border-cyan/20 hover:shadow-card-hover ${spanClass}`}
              >
                {f.image && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={f.image}
                      alt=""
                      className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                  </div>
                )}
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-11 h-11 rounded-xl bg-cyan/10 flex items-center justify-center mb-4 group-hover:bg-cyan/20 transition-colors">
                    <f.icon className="w-5 h-5 text-cyan" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{f.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-cyan text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Dashboard Showcase ─── */
function DashboardShowcase() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const imageScale = useTransform(scrollYProgress, [0, 0.5], [0.85, 1])
  const imageRotate = useTransform(scrollYProgress, [0, 0.5], [4, 0])

  const metrics = [
    { label: 'Uptime', value: '99.99', suffix: '%', color: 'text-emerald-400' },
    { label: 'Latency', value: '< 50', suffix: 'ms', color: 'text-cyan' },
    { label: 'Users', value: '50K+', suffix: '', color: 'text-violet' },
    { label: 'Requests', value: '2.4M', suffix: '/day', color: 'text-amber-400' },
  ]

  return (
    <section id="showcase" className="py-28 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet/5 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={fadeUp}
          className="text-center mb-14"
        >
          <p className="text-cyan font-mono text-xs tracking-[0.2em] uppercase mb-3">Dashboard</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Your <span className="text-gradient">command center</span>
          </h2>
        </motion.div>

        <motion.div
          style={{ scale: imageScale, rotateX: imageRotate }}
          className="relative max-w-5xl mx-auto perspective-1000"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan/10 via-violet/10 to-cyan/10 rounded-3xl blur-3xl opacity-30" />
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            src="/dashboard-preview.jpg"
            alt="Dashboard"
            className="relative w-full rounded-2xl shadow-depth border border-border/40"
          />
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              className="text-center p-4 rounded-xl bg-card/50 border border-border/30 backdrop-blur-sm"
            >
              <div className={`text-2xl sm:text-3xl font-bold font-mono ${m.color}`}>
                <AnimatedCounter end={parseFloat(m.value.replace(/[^0-9.]/g, '')) || 0} prefix={m.value.startsWith('<') ? '< ' : ''} suffix={m.suffix} decimals={m.value.includes('.') ? 2 : 0} />
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{m.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Testimonials Marquee ─── */
function Testimonials() {
  const testimonials = [
    {
      avatar: '/avatar-1.jpg',
      quote: "STARZ-OS transformed how we manage our infrastructure. We've reduced incident response time by 65%.",
      name: 'Sarah Chen',
      title: 'VP Engineering',
      company: 'TechCorp',
    },
    {
      avatar: '/avatar-2.jpg',
      quote: "The analytics dashboards alone are worth it. Real-time visibility into every metric that matters.",
      name: 'Marcus Webb',
      title: 'Lead Developer',
      company: 'DataFlow',
    },
    {
      avatar: '/avatar-3.jpg',
      quote: "We evaluated 12 platforms before choosing STARZ-OS. Nothing else came close on security and scale.",
      name: 'Elena Rossi',
      title: 'CISO',
      company: 'SecureNet',
    },
    {
      avatar: '/avatar-1.jpg',
      quote: "Deployment time dropped from hours to minutes. The auto-scaling handles traffic spikes flawlessly.",
      name: 'James Park',
      title: 'SRE Lead',
      company: 'CloudNine',
    },
    {
      avatar: '/avatar-2.jpg',
      quote: "The API documentation and SDKs are the best I've seen. Integration was done in under a day.",
      name: 'Aisha Patel',
      title: 'Platform Engineer',
      company: 'NovaLabs',
    },
  ]

  const doubled = [...testimonials, ...testimonials]

  return (
    <section id="testimonials" className="py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-cyan font-mono text-xs tracking-[0.2em] uppercase mb-3">Testimonials</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Loved by <span className="text-gradient">operators</span> worldwide
          </h2>
        </motion.div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee">
          {doubled.map((t, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[380px] mx-3 p-6 rounded-2xl bg-card border border-border/40 card-glow hover:border-cyan/20 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan/20" />
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.title}, {t.company}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{t.quote}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Pricing ─── */
function Pricing() {
  const [annual, setAnnual] = useState(true)

  const plans = [
    {
      name: 'Starter',
      price: annual ? 29 : 39,
      desc: 'For small teams getting started',
      features: ['5 team members', 'Basic analytics', 'Email support', '1 project', '7-day retention'],
      cta: 'Start Free Trial',
      highlight: false,
    },
    {
      name: 'Pro',
      price: annual ? 79 : 99,
      desc: 'For growing teams that need more',
      features: ['25 team members', 'Advanced analytics', 'Priority support', 'Unlimited projects', '90-day retention', 'Custom integrations', 'SSO authentication'],
      cta: 'Start Free Trial',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: null,
      desc: 'For large organizations',
      features: ['Unlimited members', 'Real-time analytics', 'Dedicated support', 'Unlimited projects', 'Unlimited retention', 'Custom contracts', 'On-premise option', 'SOC2 compliance'],
      cta: 'Contact Sales',
      highlight: false,
    },
  ]

  return (
    <section id="pricing" className="py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="text-cyan font-mono text-xs tracking-[0.2em] uppercase mb-3">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            Simple, <span className="text-gradient">transparent</span> pricing
          </h2>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm transition-colors ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-cyan' : 'bg-muted'}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  annual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm transition-colors ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {annual && (
              <span className="text-[10px] text-cyan bg-cyan/10 px-2 py-1 rounded-full font-medium">
                Save 25%
              </span>
            )}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className={`relative p-7 rounded-2xl border ${
                plan.highlight
                  ? 'border-cyan/30 bg-card shadow-glow'
                  : 'border-border/40 bg-card/60 shadow-card'
              } transition-all duration-300`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan text-space text-xs font-bold rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-foreground mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-5">{plan.desc}</p>
              <div className="mb-6">
                {plan.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold text-foreground tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">/mo</span>
                  </div>
                ) : (
                  <span className="text-5xl font-extrabold text-foreground tracking-tight">Custom</span>
                )}
              </div>
              <ul className="space-y-3 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-cyan flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <MagneticButton
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlight
                    ? 'bg-gradient-primary text-space hover:shadow-card-hover'
                    : 'bg-card border border-border/50 text-foreground hover:border-cyan/30 hover:bg-cyan/5'
                }`}
              >
                {plan.cta}
              </MagneticButton>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Stats Band ─── */
function StatsBand() {
  const stats = [
    { value: 50000, suffix: '+', label: 'Active Users' },
    { value: 99, suffix: '.99%', label: 'Uptime SLA' },
    { value: 150, suffix: '+', label: 'Countries' },
    { value: 2, suffix: 'B+', label: 'Requests Handled' },
  ]

  return (
    <section className="py-20 border-y border-border/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-extrabold text-gradient tracking-tight">
                <AnimatedCounter end={s.value} suffix={s.suffix} />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] mt-2">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CTA ─── */
function CTASection() {
  const navigate = useNavigate()

  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet/10 to-transparent" />
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan/5 border border-cyan/20 text-cyan text-xs font-mono tracking-widest uppercase mb-6">
            <Rocket className="w-3.5 h-3.5" />
            Start in under 5 minutes
          </div>
          <h2 className="text-4xl sm:text-6xl font-extrabold text-foreground tracking-tight mb-5">
            Ready to <span className="text-gradient">launch?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            Join thousands of teams operating on STARZ-OS. Free 14-day trial, no credit card required.
          </p>
          <MagneticButton
            onClick={() => navigate('/register')}
            className="px-10 py-4 rounded-xl bg-gradient-primary text-space font-bold text-lg glow-cyan hover:shadow-card-hover transition-all"
          >
            Start Free Trial <Rocket className="ml-2 w-5 h-5 inline" />
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-border/20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-cyan" />
              <span className="font-bold text-foreground text-lg">STARZ-OS</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The operating system for modern business operations. Command, deploy, and scale with confidence.
            </p>
          </div>
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
            { title: 'Resources', links: ['Documentation', 'API Reference', 'Blog', 'Community'] },
            { title: 'Company', links: ['About', 'Careers', 'Legal', 'Contact'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-foreground text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-cyan transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            2025 STARZ-OS. All rights reserved.
          </p>
          <div className="flex gap-3">
            {[Wifi, Cloud, Lock].map((Icon, i) => (
              <a key={i} href="#" className="p-2 rounded-lg text-muted-foreground hover:text-cyan hover:bg-cyan/5 transition-all">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-space text-foreground noise-overlay">
      <Navigation />
      <Hero />
      <TrustBar />
      <StatsBand />
      <BentoFeatures />
      <DashboardShowcase />
      <Testimonials />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  )
}
