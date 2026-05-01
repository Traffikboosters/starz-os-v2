const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');

// Check what's there
console.log('Has serp in appConfigs:', c.includes("serp: { name:'SERP Engine Control'"));
console.log('Has serp in loaders:', c.includes('serp: loadSerpContent'));
console.log('Has loadSerpContent fn:', c.includes('function loadSerpContent'));
console.log('Has dock-serp btn:', c.includes('dock-serp'));

// Fix 1: ensure serp is in appConfigs
if (!c.includes("serp: { name:'SERP Engine Control'")) {
  c = c.replace(
    "files: { name:'Work Orders'",
    "serp: { name:'SERP Engine Control', icon:'search-code', w:960, h:720 },\n  files: { name:'Work Orders'"
  );
  console.log('Added serp to appConfigs');
}

// Fix 2: ensure serp is in loaders
if (!c.includes('serp: loadSerpContent')) {
  c = c.replace(
    'files: loadFilesContent',
    'serp: loadSerpContent,\n  files: loadFilesContent'
  );
  console.log('Added serp to loaders');
}

// Fix 3: ensure lucide.createIcons() is called at end of init
if (!c.includes('lucide.createIcons()\nloadSidebar')) {
  c = c.replace(
    'lucide.createIcons()\nloadSidebar',
    'lucide.createIcons()\nloadSidebar'
  );
}

fs.writeFileSync(p, c, { encoding: 'utf8' });
console.log('Done');
console.log('Final checks:');
console.log('  appConfigs:', c.includes("serp: { name:'SERP Engine Control'"));
console.log('  loaders:', c.includes('serp: loadSerpContent'));
console.log('  fn:', c.includes('function loadSerpContent'));