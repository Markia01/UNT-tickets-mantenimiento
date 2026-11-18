'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../../context/useAuth.js'

// Sin sesión → /login. Con sesión pero con otro rol → /403.
// Mientras no se ha leído la sesión guardada (servidor e hidratación) no muestra nada,
// para no mandar a /login a alguien que sí tiene sesión.
export default function RutaProtegida({ roles, children }) {
  const { listo, usuario, rol } = useAuth()
  const router = useRouter()

  const destino = !listo ? null : !usuario ? '/login' : roles && !roles.includes(rol) ? '/403' : null

  useEffect(() => {
    if (destino) router.replace(destino)
  }, [destino, router])

  if (!listo || destino) return null
  return children
}
