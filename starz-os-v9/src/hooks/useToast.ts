import { toast } from 'sonner'

export function useToast() {
  const success = (message: string) => toast.success(message, { style: { background: '#12121A', border: '1px solid rgba(0,240,255,0.2)', color: '#F8FAFC' } })
  const error = (message: string) => toast.error(message, { style: { background: '#12121A', border: '1px solid rgba(239,68,68,0.2)', color: '#F8FAFC' } })
  const info = (message: string) => toast.info(message, { style: { background: '#12121A', border: '1px solid rgba(124,58,237,0.2)', color: '#F8FAFC' } })
  const warning = (message: string) => toast.warning(message, { style: { background: '#12121A', border: '1px solid rgba(245,158,11,0.2)', color: '#F8FAFC' } })
  const loading = (message: string) => toast.loading(message, { style: { background: '#12121A', border: '1px solid rgba(148,163,184,0.2)', color: '#F8FAFC' } })
  const dismiss = (id: string | number) => toast.dismiss(id)

  return { success, error, info, warning, loading, dismiss, toast }
}
