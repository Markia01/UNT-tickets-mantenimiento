import Card from '../../../components/ui/Card.jsx'
import { formatearFechaCorta } from '../../../utils/fechas.js'

const SIGUIENTE_PASO = {
  ABIERTO: 'Siguiente paso: asignar técnico',
  ASIGNADO: 'Siguiente paso: el técnico lo marca en proceso',
  EN_PROCESO: 'Siguiente paso: el técnico lo cierra con foto',
}

function titulo(entrada, indice, historial) {
  switch (entrada.estado) {
    case 'ABIERTO':
      return 'Abierto'
    case 'ASIGNADO': {
      const reasignado = historial.slice(0, indice).some((e) => e.estado === 'ASIGNADO')
      return `${reasignado ? 'Reasignado' : 'Asignado'} a ${entrada.tecnico?.nombre ?? 'un técnico'}`
    }
    case 'EN_PROCESO':
      return 'En proceso'
    case 'CERRADO':
      return 'Cerrado con foto'
    case 'CANCELADO':
      return 'Cancelado'
    default:
      return entrada.estado
  }
}

// Línea de tiempo del ticket. En los activos termina con un punto vacío
// que dice cuál es el siguiente paso. `nota` se muestra debajo (ticket cerrado).
export default function HistorialTicket({ ticket, ahora, tituloTarjeta = 'Historial del ticket', nota }) {
  const siguiente = SIGUIENTE_PASO[ticket.estado]
  const { historial } = ticket

  return (
    <Card titulo={tituloTarjeta}>
      <ol>
        {historial.map((entrada, i) => {
          const ultimo = i === historial.length - 1 && !siguiente
          return (
            <li
              key={`${entrada.estado}-${entrada.fecha}-${i}`}
              className={`relative pb-4 pl-7 ${ultimo ? 'pb-0' : 'before:absolute before:top-4 before:bottom-0 before:left-[5px] before:w-px before:bg-borde-campo'}`}
            >
              <span aria-hidden="true" className="absolute top-1.5 left-0 size-3 rounded-full bg-negro" />
              <p className="font-semibold">{titulo(entrada, i, historial)}</p>
              <p className="text-xs text-texto-2">
                <time dateTime={entrada.fecha}>{formatearFechaCorta(entrada.fecha, ahora)}</time>
                {' · '}
                {entrada.estado === 'ABIERTO' ? `Reportado por ${entrada.usuario.nombre}` : entrada.usuario.nombre}
              </p>
              {entrada.comentario && entrada.estado !== 'CERRADO' && (
                <p className="mt-1 text-texto-2">{entrada.comentario}</p>
              )}
            </li>
          )
        })}
        {siguiente && (
          <li className="relative pl-7">
            <span
              aria-hidden="true"
              className="absolute top-1.5 left-0 size-3 rounded-full border-2 border-texto-2/60 bg-tarjeta"
            />
            <p className="font-semibold text-texto-2">{siguiente}</p>
          </li>
        )}
      </ol>
      {nota && <p className="mt-4 rounded-lg bg-crema p-3 text-xs leading-relaxed text-texto-2">{nota}</p>}
    </Card>
  )
}
