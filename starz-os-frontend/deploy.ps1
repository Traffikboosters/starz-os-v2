# Run this after every git push to update the custom domain
$deployments = npx vercel ls 2>&1 | Select-String "starz-os-frontend-\w+-djs-projects-bd47dad7\.vercel\.app" | Select-Object -First 1
$url = $deployments -replace ".*?(https://starz-os-frontend-\w+-djs-projects-bd47dad7\.vercel\.app).*", '$1'
$url = $url.Trim()
Write-Host "Aliasing: $url"
npx vercel alias $url auth.starzcrm.traffikboosters.com