// Usuarios de prueba. La contraseña de todos es "demo1234".
export const usuariosMock = [
  {
    id: 'u1',
    nombre: 'Administración de Mantenimiento',
    correo: 'admin@utnay.edu.mx',
    rol: 'ADMIN',
    contrasena: 'demo1234',
  },
  {
    id: 'u2',
    nombre: '[TÉCNICO 2]',
    correo: 'tecnico2@utnay.edu.mx',
    rol: 'TECNICO',
    contrasena: 'demo1234',
  },
  {
    id: 'u3',
    nombre: 'Docente de prueba',
    correo: 'docente@utnay.edu.mx',
    rol: 'REPORTANTE',
    contrasena: 'demo1234',
  },
  {
    id: 'u4',
    nombre: '[TÉCNICO 1]',
    correo: 'tecnico1@utnay.edu.mx',
    rol: 'TECNICO',
    contrasena: 'demo1234',
  },
]

// Usuario sin contraseña, como lo devuelve la API
export function sinContrasena({ contrasena: _contrasena, ...usuario }) {
  return usuario
}

// En modo mock el token es "token-de-prueba-<id del usuario>"
export function usuarioDeToken(token) {
  const id = token?.replace('token-de-prueba-', '')
  return usuariosMock.find((u) => u.id === id) ?? null
}
