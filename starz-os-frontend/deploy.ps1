$lines = npx vercel ls 2>&1 | Select-String "starz-os-frontend-\w+-djs-projects-bd47dad7\.vercel\.app.*Ready"
$first = $lines | Select-Object -First 1
$url = [regex]::Match($first, 'https://starz-os-frontend-\w+-djs-projects-bd47dad7\.vercel\.app').Value
Write-Host "Aliasing: $url"
npx vercel alias $url auth.starzcrm.traffikboosters.com