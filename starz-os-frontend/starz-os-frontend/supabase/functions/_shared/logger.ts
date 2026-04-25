export function log(message: string, data?: any) {
  console.log(`[LOG] ${message}`, data || "");
}