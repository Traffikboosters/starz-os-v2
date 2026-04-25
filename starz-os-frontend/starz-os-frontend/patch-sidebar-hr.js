const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\components\\Sidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import {\n  LayoutDashboard, Users, Phone, Code2, Settings,\n  TrendingUp, ClipboardList, LogOut, PhoneCall, FileText\n} from 'lucide-react';",
  "import {\n  LayoutDashboard, Users, Phone, Code2, Settings,\n  TrendingUp, ClipboardList, LogOut, PhoneCall, FileText, UserCog\n} from 'lucide-react';"
);

content = content.replace(
  "  { name: 'Work Orders', href: '/work-orders', icon: FileText },",
  "  { name: 'Work Orders', href: '/work-orders', icon: FileText },\n  { name: 'HR Portal', href: '/hr', icon: UserCog },"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');