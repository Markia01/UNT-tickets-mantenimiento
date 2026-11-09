import { categoria, equipo } from './catalogos.js'

// Tickets de prueba con la forma descrita en docs/api.md.
// Las fechas se calculan relativas al momento en que se abre la app, así que
// siempre hay tickets vencidos, por vencer y a tiempo:
//   #14 y #11 vencidos · #13 y #10 por vencer · #15 a tiempo sin técnico.

const HORA_MS = 60 * 60 * 1000
const DIA_H = 24
const AHORA = Date.now()
const hace = (horas) => new Date(AHORA - horas * HORA_MS).toISOString()

const ADMIN = { id: 'u1', nombre: 'Administración de Mantenimiento' }
const TECNICO_1 = { id: 'u4', nombre: '[TÉCNICO 1]' }
const TECNICO_2 = { id: 'u2', nombre: '[TÉCNICO 2]' }

const DOCENTE = { id: 'u3', nombre: 'Docente de prueba', tipo: 'Docente' }
const DOCENTE_2 = { id: 'u7', nombre: '[DOCENTE 2]', tipo: 'Docente' }
const ALUMNO_1 = { id: 'u5', nombre: '[ALUMNO 1]', tipo: 'Alumno' }
const ALUMNO_2 = { id: 'u8', nombre: '[ALUMNO 2]', tipo: 'Alumno' }
const PERSONAL = { id: 'u6', nombre: '[PERSONAL 1]', tipo: 'Personal' }

// Arma un ticket completo a partir de cuántas horas atrás pasó cada cambio de estado.
// El historial se genera en orden: Abierto → Asignado → En proceso → Cerrado / Cancelado.
function crearTicket({
  id,
  equipoId,
  categoriaId,
  reporta,
  descripcion,
  creadoHace,
  tecnico = null,
  asignadoHace,
  enProcesoHace,
  cerradoHace,
  comentarioCierre = null,
  canceladoHace,
  motivoCancelacion = null,
  sumados = [],
}) {
  const cat = categoria(categoriaId)
  const creadoEn = hace(creadoHace)
  const venceEn = new Date(new Date(creadoEn).getTime() + cat.horasObjetivo * HORA_MS).toISOString()
  const persona = { id: reporta.id, nombre: reporta.nombre }

  const historial = [{ estado: 'ABIERTO', usuario: persona, comentario: null, fecha: creadoEn }]
  if (asignadoHace !== undefined) {
    historial.push({ estado: 'ASIGNADO', usuario: ADMIN, comentario: null, fecha: hace(asignadoHace) })
  }
  if (enProcesoHace !== undefined) {
    historial.push({ estado: 'EN_PROCESO', usuario: tecnico, comentario: null, fecha: hace(enProcesoHace) })
  }
  if (cerradoHace !== undefined) {
    historial.push({ estado: 'CERRADO', usuario: tecnico, comentario: comentarioCierre, fecha: hace(cerradoHace) })
  }
  if (canceladoHace !== undefined) {
    historial.push({ estado: 'CANCELADO', usuario: ADMIN, comentario: motivoCancelacion, fecha: hace(canceladoHace) })
  }

  const estado = historial.at(-1).estado
  const cerrado = estado === 'CERRADO'
  const terminado = cerrado || estado === 'CANCELADO'

  return {
    id,
    descripcion,
    estado,
    equipo: equipo(equipoId),
    categoria: cat,
    reporta,
    tecnico,
    fotoReporte: `/uploads/tickets/${id}-reporte.jpg`,
    fotoCierre: cerrado ? `/uploads/tickets/${id}-cierre.jpg` : null,
    comentarioCierre: cerrado ? comentarioCierre : null,
    motivoCancelacion: estado === 'CANCELADO' ? motivoCancelacion : null,
    creadoEn,
    venceEn,
    // Fecha en que dejó de estar activo: al cerrarse o al cancelarse
    cerradoEn: terminado ? historial.at(-1).fecha : null,
    historial,
    sumados,
  }
}

export const ticketsMock = [
  // ---- Activos ----
  crearTicket({
    id: '14',
    equipoId: 'e1',
    categoriaId: 'c1', // 48 h → vencido hace 4 h
    reporta: DOCENTE,
    descripcion: 'El aire no enfría, solo sale aire caliente y gotea sobre las bancas de enfrente.',
    creadoHace: 52,
    sumados: [ALUMNO_1, ALUMNO_2].map(({ id, nombre }) => ({ id, nombre })),
  }),
  crearTicket({
    id: '11',
    equipoId: 'e2',
    categoriaId: 'c2', // 24 h → vencido hace 6 h
    reporta: DOCENTE_2,
    descripcion: 'El proyector no enciende; la luz de la lámpara parpadea en naranja.',
    creadoHace: 30,
    tecnico: TECNICO_1,
    asignadoHace: 28,
  }),
  crearTicket({
    id: '13',
    equipoId: 'e5',
    categoriaId: 'c5', // 12 h → quedan 2 h (17 %), por vencer
    reporta: PERSONAL,
    descripcion: 'Fuga de agua en la llave del segundo lavabo; se está encharcando el piso.',
    creadoHace: 10,
    sumados: [{ id: ALUMNO_1.id, nombre: ALUMNO_1.nombre }],
  }),
  crearTicket({
    id: '10',
    equipoId: 'e4',
    categoriaId: 'c4', // 48 h → quedan 8 h (17 %), por vencer
    reporta: ALUMNO_2,
    descripcion: 'Dos paneles del pasillo están apagados y uno parpadea.',
    creadoHace: 40,
    tecnico: TECNICO_2,
    asignadoHace: 38,
    enProcesoHace: 6,
  }),
  crearTicket({
    id: '15',
    equipoId: 'e8',
    categoriaId: 'c3', // 72 h → a tiempo, sin técnico
    reporta: ALUMNO_1,
    descripcion: 'La computadora se reinicia sola a los pocos minutos de encenderla.',
    creadoHace: 3,
  }),
  crearTicket({
    id: '12',
    equipoId: 'e6',
    categoriaId: 'c1', // 48 h → a tiempo
    reporta: DOCENTE,
    descripcion: 'El control remoto del aire no responde y el equipo hace mucho ruido.',
    creadoHace: 20,
    tecnico: TECNICO_2,
    asignadoHace: 18,
  }),
  crearTicket({
    id: '16',
    equipoId: 'e3',
    categoriaId: 'c3', // 72 h → a tiempo
    reporta: DOCENTE_2,
    descripcion: 'El monitor no da imagen aunque el CPU sí enciende.',
    creadoHace: 26,
    tecnico: TECNICO_1,
    asignadoHace: 24,
    enProcesoHace: 2,
  }),
  crearTicket({
    id: '9',
    equipoId: 'e3',
    categoriaId: 'c3', // 72 h → a tiempo
    reporta: ALUMNO_2,
    descripcion: 'El teclado tiene varias teclas que no funcionan y el mouse no se detecta.',
    creadoHace: 30,
    tecnico: TECNICO_2,
    asignadoHace: 27,
  }),

  // ---- Cancelado ----
  crearTicket({
    id: '17',
    equipoId: 'e5',
    categoriaId: 'c5',
    reporta: ALUMNO_1,
    descripcion: 'Hay agua en el piso de los baños de planta baja.',
    creadoHace: 8,
    canceladoHace: 7,
    motivoCancelacion: 'Duplicado: la misma fuga ya está reportada en el #13.',
  }),

  // ---- Cerrados ----
  crearTicket({
    id: '18',
    equipoId: 'e7',
    categoriaId: 'c2',
    reporta: DOCENTE,
    descripcion: 'La imagen del proyector se ve amarilla.',
    creadoHace: 20,
    tecnico: TECNICO_2,
    asignadoHace: 19,
    enProcesoHace: 4,
    cerradoHace: 2,
    comentarioCierre: 'Se reemplazó el cable VGA dañado y se calibró el color.',
  }),
  crearTicket({
    id: '8',
    equipoId: 'e1',
    categoriaId: 'c1',
    reporta: DOCENTE_2,
    descripcion: 'El aire enfría muy poco.',
    creadoHace: 100,
    tecnico: TECNICO_2,
    asignadoHace: 30,
    enProcesoHace: 8,
    cerradoHace: 4,
    comentarioCierre: 'Se recargó gas refrigerante y se limpiaron los filtros.',
  }),
  crearTicket({
    id: '7',
    equipoId: 'e2',
    categoriaId: 'c2',
    reporta: DOCENTE,
    descripcion: 'El proyector se apaga solo después de 10 minutos.',
    creadoHace: 6 * DIA_H,
    tecnico: TECNICO_1,
    asignadoHace: 6 * DIA_H - 2,
    enProcesoHace: 2 * DIA_H,
    cerradoHace: 2 * DIA_H - 3,
    comentarioCierre: 'Se limpió el ventilador interno, que estaba obstruido por polvo.',
  }),
  crearTicket({
    id: '6',
    equipoId: 'e1',
    categoriaId: 'c1',
    reporta: ALUMNO_1,
    descripcion: 'Gotea agua del aire sobre el escritorio del docente.',
    creadoHace: 20 * DIA_H,
    tecnico: TECNICO_1,
    asignadoHace: 20 * DIA_H - 3,
    enProcesoHace: 19 * DIA_H,
    cerradoHace: 19 * DIA_H - 4,
    comentarioCierre: 'Se destapó la manguera de drenado.',
  }),
  crearTicket({
    id: '5',
    equipoId: 'e1',
    categoriaId: 'c1',
    reporta: DOCENTE,
    descripcion: 'El aire no enciende.',
    creadoHace: 35 * DIA_H,
    tecnico: TECNICO_2,
    asignadoHace: 35 * DIA_H - 2,
    enProcesoHace: 34 * DIA_H,
    cerradoHace: 34 * DIA_H - 5,
    comentarioCierre: 'Se cambió el capacitor del compresor.',
  }),
  crearTicket({
    id: '4',
    equipoId: 'e1',
    categoriaId: 'c1',
    reporta: PERSONAL,
    descripcion: 'El aire hace un ruido metálico fuerte al arrancar.',
    creadoHace: 50 * DIA_H,
    tecnico: TECNICO_1,
    asignadoHace: 50 * DIA_H - 1,
    enProcesoHace: 49 * DIA_H,
    cerradoHace: 49 * DIA_H - 2,
    comentarioCierre: 'Se ajustaron los tornillos de la base del ventilador.',
  }),
  crearTicket({
    id: '3',
    equipoId: 'e2',
    categoriaId: 'c2',
    reporta: DOCENTE_2,
    descripcion: 'El proyector no detecta la entrada HDMI.',
    creadoHace: 60 * DIA_H,
    tecnico: TECNICO_2,
    asignadoHace: 60 * DIA_H - 2,
    enProcesoHace: 59 * DIA_H,
    cerradoHace: 59 * DIA_H - 1,
    comentarioCierre: 'Se reemplazó el puerto HDMI de la placa de conexiones.',
  }),
  crearTicket({
    id: '2',
    equipoId: 'e1',
    categoriaId: 'c1',
    reporta: DOCENTE,
    descripcion: 'El aire tira hielo por la rejilla.',
    creadoHace: 80 * DIA_H,
    tecnico: TECNICO_1,
    asignadoHace: 80 * DIA_H - 2,
    enProcesoHace: 79 * DIA_H,
    cerradoHace: 79 * DIA_H - 3,
    comentarioCierre: 'Se descongeló el serpentín y se limpiaron los filtros.',
  }),
  // Fuera de la ventana de 90 días: no cuenta para "Equipos con más fallas"
  crearTicket({
    id: '1',
    equipoId: 'e1',
    categoriaId: 'c1',
    reporta: PERSONAL,
    descripcion: 'El aire no enfría.',
    creadoHace: 120 * DIA_H,
    tecnico: TECNICO_2,
    asignadoHace: 120 * DIA_H - 2,
    enProcesoHace: 119 * DIA_H,
    cerradoHace: 119 * DIA_H - 2,
    comentarioCierre: 'Se recargó gas refrigerante.',
  }),
]
