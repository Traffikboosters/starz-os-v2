export const FORBIDDEN_EXPORT_ROUTES = ["/api/export/leads"]
export const ALLOWED_EXPORT_ROUTES = ["/api/export/stats"]

export function isExportAllowed(route: string): boolean {
  if (FORBIDDEN_EXPORT_ROUTES.some(r => route.includes(r))) return false
  return ALLOWED_EXPORT_ROUTES.some(r => route.includes(r))
}