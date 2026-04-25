const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\steve\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add import at top
content = content.replace(
  "import { TrendingUp, Users, Target, Flame, AlertCircle, Loader2, BarChart3, PieChart, Activity } from 'lucide-react';",
  "import { TrendingUp, Users, Target, Flame, AlertCircle, Loader2, BarChart3, PieChart, Activity, FileText } from 'lucide-react';\nimport { getWorkOrders, getStatusColor, getPaymentStatusColor, type WorkOrder } from '@/lib/workOrders';"
);

// Add state after existing state declarations
content = content.replace(
  "const STEVE_AVATAR =",
  "// WorkOrders state added via patch\nconst STEVE_AVATAR ="
);

// Insert work orders section before <SteveChat />
const woSection = `
          {/* Closed Deals - Work Orders */}
          <Card className="lg:col-span-3 mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  Closed Deals — Work Orders
                </CardTitle>
                <a href="/work-orders" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">View all →</a>
              </div>
            </CardHeader>
            <CardContent>
              <SteveWorkOrders />
            </CardContent>
          </Card>

`;

content = content.replace('<SteveChat />', woSection + '        <SteveChat />');

fs.writeFileSync(path, content, 'utf8');
console.log('Done');