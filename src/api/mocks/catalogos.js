// Catálogos de prueba: categorías (con horas objetivo), tipos de equipo, equipos
// y la configuración de la regla de reemplazo.

export const configuracionMock = {
  reemplazo: { fallas: 4, dias: 90 },
}

export const tiposEquipoMock = [
  'Aire acondicionado',
  'Computadora',
  'Contacto eléctrico',
  'Instalación hidráulica',
  'Luminaria',
  'Pizarrón',
  'Proyector',
]

export const categoriasMock = [
  { id: 'c1', nombre: 'Climatización', horasObjetivo: 48 },
  { id: 'c2', nombre: 'Audiovisual', horasObjetivo: 24 },
  { id: 'c3', nombre: 'Cómputo', horasObjetivo: 72 },
  { id: 'c4', nombre: 'Eléctrica', horasObjetivo: 48 },
  { id: 'c5', nombre: 'Plomería', horasObjetivo: 12 },
]

export const equiposMock = [
  {
    id: 'e1',
    tipo: 'Aire acondicionado',
    descripcion: 'Minisplit Mirage 2 ton',
    ubicacion: { edificio: 'Edificio B', aula: 'Aula 3' },
  },
  {
    id: 'e2',
    tipo: 'Proyector',
    descripcion: 'Epson PowerLite X49',
    ubicacion: { edificio: 'Edificio A', aula: 'Aula 1' },
  },
  {
    id: 'e3',
    tipo: 'Computadora',
    descripcion: 'Dell OptiPlex 3080 · equipo 12',
    ubicacion: { edificio: 'Edificio C', aula: 'Laboratorio 2' },
  },
  {
    id: 'e4',
    tipo: 'Luminaria',
    descripcion: 'Panel LED 60×60',
    ubicacion: { edificio: 'Edificio C', aula: 'Pasillo' },
  },
  {
    id: 'e5',
    tipo: 'Instalación hidráulica',
    descripcion: 'Lavabos y llaves de los baños',
    ubicacion: { edificio: 'Edificio A', aula: 'Baños PB' },
  },
  {
    id: 'e6',
    tipo: 'Aire acondicionado',
    descripcion: 'Minisplit LG 1.5 ton',
    ubicacion: { edificio: 'Edificio A', aula: 'Aula 5' },
  },
  {
    id: 'e7',
    tipo: 'Proyector',
    descripcion: 'BenQ MS560',
    ubicacion: { edificio: 'Edificio C', aula: 'Aula 8' },
  },
  {
    id: 'e8',
    tipo: 'Computadora',
    descripcion: 'HP ProDesk 400 · equipo 4',
    ubicacion: { edificio: 'Edificio B', aula: 'Laboratorio 1' },
  },
  // Sin tickets: aparecen con 0 fallas
  {
    id: 'e9',
    tipo: 'Proyector',
    descripcion: 'Epson PowerLite E20',
    ubicacion: { edificio: 'Edificio B', aula: 'Aula 2' },
  },
  {
    id: 'e10',
    tipo: 'Contacto eléctrico',
    descripcion: 'Muro frontal, doble',
    ubicacion: { edificio: 'Edificio B', aula: 'Aula 5' },
  },
  {
    id: 'e11',
    tipo: 'Pizarrón',
    descripcion: 'Pizarrón blanco 1.2 × 2.4 m',
    ubicacion: { edificio: 'Edificio C', aula: 'Aula 8' },
  },
  // Dado de baja: su historial se conserva, pero no aparece entre los activos
  {
    id: 'e12',
    tipo: 'Computadora',
    descripcion: 'HP Compaq 6200 · equipo 7',
    ubicacion: { edificio: 'Edificio C', aula: 'Laboratorio 2' },
    estado: 'BAJA',
  },
]

// Todos los equipos tienen estado; si no se indicó, están activos
for (const e of equiposMock) e.estado ??= 'ACTIVO'

export const categoria = (id) => categoriasMock.find((c) => c.id === id)
export const equipo = (id) => equiposMock.find((e) => e.id === id)
