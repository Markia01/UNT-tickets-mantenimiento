const NOMBRE_ROL = {
  ADMIN: 'Administrador',
  TECNICO: 'Técnico',
  REPORTANTE: 'Reportante',
}

// Nombre del rol para mostrar en la interfaz
export function nombreRol(rol) {
  return NOMBRE_ROL[rol] ?? rol ?? ''
}

const PALABRAS_MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'y'])

// Dos iniciales a partir del nombre: "Docente de prueba" → "DP"
export function iniciales(nombre = '') {
  const palabras = nombre
    .trim()
    .split(/\s+/)
    .filter((p) => p && !PALABRAS_MENORES.has(p.toLowerCase()))
  return palabras
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}
