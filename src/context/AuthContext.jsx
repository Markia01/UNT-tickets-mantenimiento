'use client'

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { login as loginApi } from '../api/auth.js'
import { registrarAlNoAutorizado } from '../api/cliente.js'
import { borrarSesion, guardarSesion, leerSesion, leerSesionServidor, suscribirSesion } from './sesionGuardada.js'
import { AuthContext } from './useAuth.js'

export function AuthProvider({ children }) {
  // `undefined` en el servidor y durante la hidratación; luego la sesión guardada
  const sesion = useSyncExternalStore(suscribirSesion, leerSesion, leerSesionServidor)

  const logout = useCallback(() => borrarSesion(), [])

  const login = useCallback(async (correo, contrasena) => {
    const { token, usuario } = await loginApi(correo, contrasena)
    guardarSesion(token, usuario)
    return usuario
  }, [])

  // Si la API responde 401 se cierra la sesión; las rutas protegidas mandan a /login
  useEffect(() => {
    registrarAlNoAutorizado(logout)
    return () => registrarAlNoAutorizado(null)
  }, [logout])

  const valor = useMemo(
    () => ({
      // false mientras no se ha leído localStorage (servidor e hidratación)
      listo: sesion !== undefined,
      usuario: sesion?.usuario ?? null,
      rol: sesion?.usuario?.rol ?? null,
      token: sesion?.token ?? null,
      login,
      logout,
    }),
    [sesion, login, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
