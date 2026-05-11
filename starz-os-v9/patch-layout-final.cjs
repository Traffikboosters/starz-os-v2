const fs = require('fs');
const FILE = 'C:/Users/mbecn/my-app/starz-os-v9/src/components/Layout.tsx';
let src = fs.readFileSync(FILE, 'utf8');

src = src.replace(
  "  Send, Code2, Package, Radio, ChevronLeft, ChevronRight} from 'lucide-react'",
  "  Send, Code2, Package, Radio, ChevronLeft, ChevronRight,\n  Users, Mail, Database, Crosshair} from 'lucide-react'"
);

src = src.replace(
  "  { to: '/leads', icon: Target, label: 'Leads' },",
  "  { to: '/crm-war-room', icon: Crosshair, label: 'CRM War Room' },\n  { to: '/linkedin', icon: Database, label: 'LinkedIn' },\n  { to: '/leads', icon: Target, label: 'Leads' },"
);

src = src.replace(
  "  { to: '/command-center', icon: Radio, label: 'Command Center' },",
  "  { to: '/command-center', icon: Radio, label: 'Command Center' },\n  { to: '/scraper-control', icon: Database, label: 'Scraper Center' },"
);

const workforceBlock = `// ─── WORKFORCE NAV─────────────────────────────────────────────────
const workforceNav = [
  { to: '/zara-hr', icon: Users, label: 'Zara HR' },
]
const communicationsNav = [
  { to: '/starz-mail', icon: Mail, label: 'STARZ Mail' },
]
`;

src = src.replace(
  "// ─── SYSTEM NAV ────────────────────────────────────────────────────",
  workforceBlock + "// ─── SYSTEM NAV ────────────────────────────────────────────────────"
);

const sysIdx = src.indexOf('{systemNav.map(renderNavItem)}');
if (sysIdx > -1) {
  const divIdx = src.lastIndexOf('<div', sysIdx);
  const insert = `{/* Workforce */}
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1 mt-2">Workforce</p>}
          {workforceNav.map(renderNavItem)}
        </div>
        <div className="space-y-1">
          {!collapsed && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1">Communications</p>}
          {communicationsNav.map(renderNavItem)}
        </div>
        `;
  src = src.substring(0, divIdx) + insert + src.substring(divIdx);
}

fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
console.log('Done');
