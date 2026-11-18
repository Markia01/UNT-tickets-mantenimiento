'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/context/useAuth.js'
import { rutaInicio } from '@/utils/rutaInicio.js'

// "/" manda a la pantalla de inicio del rol, o al login si no hay sesión
export default function RedirigirInicio() {
  const { listo, rol } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (listo) router.replace(rutaInicio(rol))
  }, [listo, rol, router])

  return null
}
