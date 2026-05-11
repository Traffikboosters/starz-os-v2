const fs = require('fs');
const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/components/Layout.tsx';

// Restore from backup first
const backup = fs.readFileSync('C:/Users/mbecn/my-app/starz-os-v9/layout-backup.txt', 'utf8');
let src = backup;

// 1. Add icons
src = src.replace(
  "  Send, Code2, Package, Radio, ChevronLeft, ChevronRight} from 'lucide-react'",
  "  Send, Code2, Package, Radio, ChevronLeft, ChevronRight,\n  Users, Mail, Database, Crosshair} from 'lucide-react'"
);

// 2. Add CRM War Room + LinkedIn to salesNav
src = src.replace(
  "  { to: '/leads', icon: Target, label: 'Leads' },",
  "  { to: '/crm-war-room', icon: Crosshair, label: 'CRM War Room' },\n  { to: '/linkedin', icon: Database, label: 'LinkedIn' },\n  { to: '/leads', icon: Target, label: 'Leads' },"
);

// 3. Add Scraper Center to systemNav
src = src.replace(
  "  { to: '/command-center', icon: Radio, label: 'Command Center' },",
  "  { to: '/command-center', icon: Radio, label: 'Command Center' },\n  { to: '/scraper-control', icon: Database, label: 'Scraper Center' },"
);

// 4. Add workforce + communications nav arrays before systemNav
src = src.replace(
  "// ─── SYSTEM NAV ────────────────────────────────────────────────────\nconst systemNav",
  "const workforceNav = [\n  { to: '/zara-hr', icon: Users, label: 'Zara HR' },\n]\nconst communicationsNav = [\n  { to: '/starz-mail', icon: Mail, label: 'STARZ Mail' },\n]\n// ─── SYSTEM NAV ────────────────────────────────────────────────────\nconst systemNav"
);

// 5. Add workforce + communications sections in JSX - find fulfillmentNav render and add after
src = src.replace(
  "{fulfillmentNav.map(renderNavItem)}\n        </div>",
  "{fulfillmentNav.map(renderNavItem)}\n        </div>\n        <div className=\"space-y-1\">\n          {!collapsed && <p className=\"text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 mt-2\">Workforce</p>}\n          {workforceNav.map(renderNavItem)}\n        </div>\n        <div className=\"space-y-1\">\n          {!collapsed && <p className=\"text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1\">Communications</p>}\n          {communicationsNav.map(renderNavItem)}\n        </div>"
);

fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
console.log('Done - restored from backup and applied clean patches');
