import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

// const toast = useToast()
// toast.exito('Técnico asignado al ticket #14')
// toast.error('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.')
export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return contexto
}
