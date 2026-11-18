'use client'

import { ToastProvider } from '@/components/ui/Toast.jsx'
import { AuthProvider } from '@/context/AuthContext.jsx'

// Contextos de toda la app (sesión y avisos). Es un componente de cliente para
// que el layout raíz pueda seguir siendo de servidor.
export default function Providers({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  )
}
