const fs = require('fs');
const p = 'C:/Users/mbecn/my-app/starz-os-frontend-v2/public/starz-os.html';
let c = fs.readFileSync(p, 'utf8');

// Update the pipeline single run to use production-scraper
c = c.replace(
  "SB_URL+'/functions/v1/data-pipeline', { method:'POST', headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'}, body:JSON.stringify({action:'run_single',keyword:kw,location:loc,limit:Number(lim)})",
  "SB_URL+'/functions/v1/production-scraper', { method:'POST', headers:{'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'}, body:JSON.stringify({action:'scrape',keyword:kw,location:loc,limit:Number(lim),engines:['google_maps','serpapi_maps','serpapi_organic']})"
);

fs.writeFileSync(p, c, 'utf8');
console.log('Updated:', c.includes('production-scraper'));