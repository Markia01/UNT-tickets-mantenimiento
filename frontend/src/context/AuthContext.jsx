import { useCallback, useEffect, useMemo, useState } from 'react'
import { login as loginApi } from '../api/auth.js'
import { CLAVE_TOKEN, registrarAlNoAutorizado } from '../api/cliente.js'
import { AuthContext } from './useAuth.js'

const CLAVE_USUARIO = 'usuario'

// Lee la sesión guardada. El usuario se guarda junto al token para conservar
// el rol al recargar la página (la API no tiene todavía un endpoint /auth/me).
function leerSesion() {
  try {
    const token = localStorage.getItem(CLAVE_TOKEN)
    const usuario = JSON.parse(localStorage.getItem(CLAVE_USUARIO) ?? 'null')
    if (token && usuario?.rol) return { token, usuario }
  } catch {
    // Datos corruptos: se ignora la sesión guardada
  }
  return { token: null, usuario: null }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion)

  const logout = useCallback(() => {
    localStorage.removeItem(CLAVE_TOKEN)
    localStorage.removeItem(CLAVE_USUARIO)
    setSesion({ token: null, usuario: null })
  }, [])

  const login = useCallback(async (correo, contrasena) => {
    const { token, usuario } = await loginApi(correo, contrasena)
    localStorage.setItem(CLAVE_TOKEN, token)
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
    setSesion({ token, usuario })
    return usuario
  }, [])

  // Si la API responde 401 se cierra la sesión; las rutas protegidas mandan a /login
  useEffect(() => {
    registrarAlNoAutorizado(logout)
    return () => registrarAlNoAutorizado(null)
  }, [logout])

  const valor = useMemo(
    () => ({
      usuario: sesion.usuario,
      rol: sesion.usuario?.rol ?? null,
      token: sesion.token,
      login,
      logout,
    }),
    [sesion, login, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
