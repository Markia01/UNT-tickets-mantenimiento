// Convierte los documentos de MongoDB a la forma que describe docs/api.md.

const iso = (fecha) => (fecha ? new Date(fecha).toISOString() : null)

export function aUsuario(doc) {
  const usuario = {
    id: String(doc._id),
    nombre: doc.nombre,
    correo: doc.correo,
    rol: doc.rol,
    activo: doc.activo !== false,
  }
  if (doc.rol === 'REPORTANTE' && doc.tipo) usuario.tipo = doc.tipo
  return usuario
}

export const aCategoria = (doc) => ({
  id: String(doc._id),
  nombre: doc.nombre,
  horasObjetivo: doc.horasObjetivo,
  activa: doc.activa !== false,
})

// Copia que guarda cada ticket al crearse
export const copiaCategoria = (doc) => ({ id: String(doc._id), nombre: doc.nombre, horasObjetivo: doc.horasObjetivo })

// Equipo como va dentro de un ticket o de los catálogos (sin fallas)
export const aEquipoBasico = (doc) => ({
  id: String(doc._id),
  tipo: doc.tipo,
  descripcion: doc.descripcion,
  ubicacion: { edificio: doc.ubicacion.edificio, aula: doc.ubicacion.aula },
  estado: doc.estado,
})

const aPersona = (p) => (p ? { id: p.id, nombre: p.nombre } : null)

// `doc.equipo` debe venir con populate('equipo')
export function aTicket(doc) {
  return {
    id: String(doc._id),
    descripcion: doc.descripcion,
    estado: doc.estado,
    equipo: doc.equipo ? aEquipoBasico(doc.equipo) : null,
    categoria: { id: doc.categoria.id, nombre: doc.categoria.nombre, horasObjetivo: doc.categoria.horasObjetivo },
    reporta: { id: doc.reporta.id, nombre: doc.reporta.nombre, tipo: doc.reporta.tipo ?? null },
    tecnico: aPersona(doc.tecnico),
    fotoReporte: doc.fotoReporte ?? null,
    fotoCierre: doc.fotoCierre ?? null,
    comentarioCierre: doc.comentarioCierre ?? null,
    motivoCancelacion: doc.motivoCancelacion ?? null,
    creadoEn: iso(doc.creadoEn),
    venceEn: iso(doc.venceEn),
    cerradoEn: iso(doc.cerradoEn),
    historial: (doc.historial ?? []).map((h) => {
      const entrada = { estado: h.estado, usuario: aPersona(h.usuario) }
      if (h.tecnico?.id) entrada.tecnico = aPersona(h.tecnico)
      entrada.comentario = h.comentario ?? null
      entrada.fecha = iso(h.fecha)
      return entrada
    }),
    sumados: (doc.sumados ?? []).map(aPersona),
  }
}
