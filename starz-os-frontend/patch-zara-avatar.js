const fs = require('fs');
const path = 'C:\\Users\\mbecn\\my-app\\starz-os-frontend\\app\\hr\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const ZARA_AVATAR = 'https://szguizvpiiuiyugrjeks.supabase.co/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Rico.png';",
  "const ZARA_AVATAR = 'https://auth.starzcrm.traffikboosters.com/storage/v1/object/public/starz-ai-agents/AI%20AGENTS/Zara.png';"
);

// Add avatar to header
content = content.replace(
  "        <div className=\"w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center\">\n          <Users className=\"w-6 h-6 text-purple-400\" />\n        </div>",
  "        <img src={ZARA_AVATAR} alt=\"Zara\" className=\"w-12 h-12 rounded-xl object-cover\" onError={e => { e.currentTarget.style.display='none'; }} />"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');