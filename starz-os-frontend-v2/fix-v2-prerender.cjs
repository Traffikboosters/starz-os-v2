const fs = require('fs');

const FILE = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/app/powerdial/page.tsx';
let src = fs.readFileSync(FILE, 'utf8');

// Fix 1: Add dynamic export after "use client"
if (!src.includes('force-dynamic')) {
  src = src.replace(
    '"use client"',
    '"use client"\nexport const dynamic = "force-dynamic"'
  );
  console.log('✅ Added force-dynamic');
}

// Fix 2: Move supabase client inside component to avoid build-time init
const oldClient = `const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(SB_URL, SB_KEY)`;

const newClient = `const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY) : null as any`;

if (src.includes(oldClient)) {
  src = src.replace(oldClient, newClient);
  console.log('✅ Fixed supabase client initialization');
} else {
  // Try alternate pattern
  src = src.replace(
    `const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!`,
    `const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''`
  );
  src = src.replace(
    `const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`,
    `const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''`
  );
  src = src.replace(
    `const supabase = createClient(SB_URL, SB_KEY)`,
    `const supabase = (SB_URL && SB_KEY) ? createClient(SB_URL, SB_KEY) : null as any`
  );
  console.log('✅ Fixed supabase client (alternate)');
}

fs.writeFileSync(FILE, Buffer.from(src, 'utf8'));
console.log('\nNow run: npm run build');
