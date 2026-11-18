const INICIO_POR_ROL = {
  ADMIN: '/admin',
  TECNICO: '/tecnico',
  REPORTANTE: '/reportar',
}

// Pantalla a la que va cada rol después de iniciar sesión
export function rutaInicio(rol) {
  return INICIO_POR_ROL[rol] ?? '/login'
}
