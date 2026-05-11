const fs = require('fs');
const path = require('path');
const BASE = 'C:/Users/mbecn/my-app/starz-os-frontend-v2';

// Fix 1: powerdial/page.tsx — arrow -> JSX issue on line 483
const powerDialFile = path.join(BASE, 'app/powerdial/page.tsx');
let pd = fs.readFileSync(powerDialFile, 'utf8');
const oldArrow = `<div className="text-slate-400 ml-2">-> {item.rebuttal}</div>`;
const newArrow = `<div className="text-slate-400 ml-2">{"-> "}{item.rebuttal}</div>`;
if (pd.includes(oldArrow)) {
  pd = pd.replace(oldArrow, newArrow);
  fs.writeFileSync(powerDialFile, Buffer.from(pd, 'utf8'));
  console.log('✅ Fixed: powerdial arrow JSX');
} else {
  console.error('❌ Could not find arrow in powerdial/page.tsx');
}

// Fix 2: leads/page.tsx — wrong import name
const leadsFile = path.join(BASE, 'app/leads/page.tsx');
let leads = fs.readFileSync(leadsFile, 'utf8');
const oldImport = `import { getSupabaseServerClient } from "@/lib/supabase/server";`;
const newImport = `import { createClient as getSupabaseServerClient } from "@/lib/supabase/server";`;
if (leads.includes(oldImport)) {
  leads = leads.replace(oldImport, newImport);
  fs.writeFileSync(leadsFile, Buffer.from(leads, 'utf8'));
  console.log('✅ Fixed: leads import');
} else {
  // Try alternate fix
  const alt = leads.replace('getSupabaseServerClient', 'createClient');
  if (alt !== leads) {
    fs.writeFileSync(leadsFile, Buffer.from(alt, 'utf8'));
    console.log('✅ Fixed: leads import (alt)');
  } else {
    console.error('❌ Could not find leads import');
  }
}

// Fix 3: Conflicting route — find the [[...slug]] route file and remove it
const routeFile = path.join(BASE, 'app/[[...slug]]/route.ts');
const routeFile2 = path.join(BASE, 'app/[[...slug]]/route.tsx');
if (fs.existsSync(routeFile)) {
  fs.unlinkSync(routeFile);
  console.log('✅ Fixed: removed conflicting [[...slug]]/route.ts');
} else if (fs.existsSync(routeFile2)) {
  fs.unlinkSync(routeFile2);
  console.log('✅ Fixed: removed conflicting [[...slug]]/route.tsx');
} else {
  // Find it
  function findFile(dir, name) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        const found = findFile(path.join(dir, item.name), name);
        if (found) return found;
      } else if (item.name === name) {
        return path.join(dir, item.name);
      }
    }
    return null;
  }
  const found = findFile(path.join(BASE, 'app'), 'route.ts') || findFile(path.join(BASE, 'app'), 'route.tsx');
  if (found && found.includes('slug')) {
    fs.unlinkSync(found);
    console.log(`✅ Fixed: removed ${found}`);
  } else {
    console.log('ℹ️  Slug route not found — may already be resolved');
  }
}

console.log('\nNow run: npm run build');
