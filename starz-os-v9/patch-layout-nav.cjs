const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/components/Layout.tsx';
let src = fs.readFileSync(FILE, 'utf8');

// Fix 1: Add missing icons to import
const oldIcons = `  LayoutDashboard, Phone, CreditCard, FileText, Target,
  Briefcase, Settings, Shield, Zap, Globe, Bot, BarChart3,
  Send, Code2, Package, Radio, ChevronLeft, ChevronRight} from 'lucide-react'`;

const newIcons = `  LayoutDashboard, Phone, CreditCard, FileText, Target,
  Briefcase, Settings, Shield, Zap, Globe, Bot, BarChart3,
  Send, Code2, Package, Radio, ChevronLeft, ChevronRight,
  Users, Linkedin, Mail, Database, Crosshair, ServerCog} from 'lucide-react'`;

// Fix 2: Add missing nav sections
const oldSalesNav = `// ─── SALES DIVISION NAV ────────────────────────────────────────────
const salesNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Target, label: 'Leads' },
  { to: '/powerdial', icon: Phone, label: 'PowerDial' },
  { to: '/outreach', icon: Send, label: 'Outreach' },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/steve', icon: Bot, label: 'AI Steve' },
]
// ─── FULFILLMENT DIVISION NAV ──────────────────────────────────────
const fulfillmentNav = [
  { to: '/work-orders', icon: Briefcase, label: 'Work Orders' },
  { to: '/developer-workspace', icon: Code2, label: 'Dev Workspace' },
  { to: '/seo-operations', icon: Globe, label: 'SEO Ops' },
  { to: '/deliverables', icon: Package, label: 'Deliverables' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]
// ─── SYSTEM NAV ────────────────────────────────────────────────────
const systemNav = [
  { to: '/command-center', icon: Radio, label: 'Command Center' },
  { to: '/automation', icon: Zap, label: 'Automation' },
  { to: '/security', icon: Shield, label: 'Security' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]`;

const newSalesNav = `// ─── SALES DIVISION NAV ────────────────────────────────────────────
const salesNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/crm-war-room', icon: Crosshair, label: 'CRM War Room' },
  { to: '/linkedin', icon: Linkedin, label: 'LinkedIn' },
  { to: '/leads', icon: Target, label: 'Leads' },
  { to: '/powerdial', icon: Phone, label: 'PowerDial' },
  { to: '/outreach', icon: Send, label: 'Outreach' },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/steve', icon: Bot, label: 'AI Steve' },
]
// ─── FULFILLMENT DIVISION NAV ──────────────────────────────────────
const fulfillmentNav = [
  { to: '/work-orders', icon: Briefcase, label: 'Work Orders' },
  { to: '/developer-workspace', icon: Code2, label: 'Dev Workspace' },
  { to: '/seo-operations', icon: Globe, label: 'SEO Ops' },
  { to: '/deliverables', icon: Package, label: 'Deliverables' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]
// ─── WORKFORCE NAV ─────────────────────────────────────────────────
const workforceNav = [
  { to: '/zara-hr', icon: Users, label: 'Zara HR' },
]
// ─── COMMUNICATIONS NAV ────────────────────────────────────────────
const communicationsNav = [
  { to: '/starz-mail', icon: Mail, label: 'STARZ Mail' },
]
// ─── SYSTEM NAV ────────────────────────────────────────────────────
const systemNav = [
  { to: '/command-center', icon: Radio, label: 'Command Center' },
  { to: '/scraper-control', icon: Database, label: 'Scraper Center' },
  { to: '/automation', icon: Zap, label: 'Automation' },
  { to: '/security', icon: Shield, label: 'Security' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]`;

// Fix 3: Add the missing nav sections to the sidebar render
const oldNavRender = `        {fulfillmentNav.map(renderNavItem)}
        </div>
        {/* System */}
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">System</p>}
        {systemNav.map(renderNavItem)}
        </div>`;

const newNavRender = `        {fulfillmentNav.map(renderNavItem)}
        </div>
        {/* Workforce */}
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">Workforce</p>}
          {workforceNav.map(renderNavItem)}
        </div>
        {/* Communications */}
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">Communications</p>}
          {communicationsNav.map(renderNavItem)}
        </div>
        {/* System */}
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">System</p>}
        {systemNav.map(renderNavItem)}
        </div>`;

const patches = [
  [oldIcons, newIcons, 'add missing icons'],
  [oldSalesNav, newSalesNav, 'add missing nav sections'],
];

let allGood = true;
for (const [oldStr, newStr, label] of patches) {
  if (!src.includes(oldStr)) {
    console.error(`❌ PATCH FAILED: "${label}"`);
    allGood = false;
  } else {
    src = src.replace(oldStr, newStr);
    console.log(`✅ Patched: ${label}`);
  }
}

// Fix 3: Try to add workforce/communications sections
if (src.includes(oldNavRender)) {
  src = src.replace(oldNavRender, newNavRender);
  console.log('✅ Patched: sidebar render sections');
} else {
  console.log('ℹ️  Nav render section not found — checking alternate pattern...');
  // Try to find where systemNav is rendered and add before it
  const sysIdx = src.indexOf('{systemNav.map(renderNavItem)}');
  if (sysIdx > -1) {
    const insertBefore = src.lastIndexOf('<div className="space-y-1">', sysIdx);
    const prefix = src.substring(0, insertBefore);
    const suffix = src.substring(insertBefore);
    src = prefix + `        {/* Workforce */}
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">Workforce</p>}
          {workforceNav.map(renderNavItem)}
        </div>
        {/* Communications */}
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">Communications</p>}
          {communicationsNav.map(renderNavItem)}
        </div>
        ` + suffix;
    console.log('✅ Patched: sidebar render (alternate method)');
  }
}

if (allGood) {
  fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
  console.log('\n🚀 Layout.tsx updated! Now run:');
  console.log('npm run build');
  console.log('git add -A && git commit -m "feat: add missing sidebar nav items" && git push origin main');
}
