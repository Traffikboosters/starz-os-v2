const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\steve\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

const component = `
function SteveWorkOrders() {
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getWorkOrders().then((data) => {
      setWorkOrders(data.filter((wo) => wo.status === 'active' || wo.status === 'probation' || wo.status === 'fulfilled'));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="py-8 text-center text-white/30 text-sm flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>;
  if (workOrders.length === 0) return <div className="py-8 text-center text-white/20 text-sm">No closed deals converted to work orders yet</div>;

  return (
    <div className="space-y-2">
      {workOrders.map((wo) => (
        <div key={wo.id} className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{wo.business_name || wo.client_name}</p>
            <p className="text-xs text-white/40 mt-0.5">{wo.service || wo.project_type || 'Service'} · {wo.proposal_id || '—'}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={\`px-2 py-0.5 rounded-full text-xs font-medium capitalize \${getStatusColor(wo.status)}\`}>{wo.status}</span>
            <span className={\`px-2 py-0.5 rounded-full text-xs font-medium capitalize \${getPaymentStatusColor(wo.payment_status)}\`}>{wo.payment_status || '—'}</span>
            <span className="text-sm text-white/60 font-medium">{wo.total_amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(wo.total_amount) : '—'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

`;

// Insert before the default export
content = content.replace('export default function', component + 'export default function');

// Add React import if not present
if (!content.includes("import React")) {
  content = content.replace("'use client';", "'use client';\nimport React from 'react';");
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done');