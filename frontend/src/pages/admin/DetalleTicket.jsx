import { useCallback, useRef } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { getTicket } from '../../api/tickets.js'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Pill from '../../components/ui/Pill.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import { useDatos } from '../../hooks/useDatos.js'
import { formatearFechaCompleta, formatearFechaCorta } from '../../utils/fechas.js'
import { calcularSemaforo, esActivo } from '../../utils/semaforo.js'
import { formatearUbicacion } from '../../utils/ticket.js'
import HistorialTicket from './detalle/HistorialTicket.jsx'
import { Dato, ESTILO_ENLACE, Foto, PillTiempo } from './detalle/piezas.jsx'
import SiguientePaso from './detalle/SiguientePaso.jsx'

const NOTA_CERRADO =
  'Un ticket cerrado ya no se puede editar. Si la falla vuelve, se reporta un ticket nuevo y queda en el historial del equipo.'

const textoSumados = (n) =>
  n === 1 ? '1 persona más reportó esta falla' : `${n} personas más reportaron esta falla`

// ---------- Piezas de la página ----------

function Encabezado({ ticket, ahora, volverA, refTitulo }) {
  return (
    <header className="space-y-3">
      <nav aria-label="Ruta de navegación">
        <ol className="flex items-center gap-1 text-xs text-texto-2">
          <li>
            <Link
              to={volverA}
              className="text-negro underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro"
            >
              Tickets
            </Link>
          </li>
          <li aria-current="page">
            <span aria-hidden="true">/ </span>#{ticket.id}
          </li>
        </ol>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* tabIndex -1: tras cancelar, el foco vuelve aquí en lugar de perderse */}
        <h2 ref={refTitulo} tabIndex={-1} className="text-[26px] leading-tight font-bold focus:outline-none">
          {ticket.equipo.tipo}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tipo="estado" valor={ticket.estado} />
          <PillTiempo ticket={ticket} ahora={ahora} />
        </div>
      </div>
    </header>
  )
}

function FranjaCancelado({ ticket, ahora }) {
  const entrada = ticket.historial.findLast((e) => e.estado === 'CANCELADO')
  return (
    <div role="note" className="rounded-xl border border-borde bg-borde/60 p-4">
      <p>
        <span className="font-semibold">Ticket cancelado:</span> {ticket.motivoCancelacion}.
      </p>
      {entrada && (
        <p className="mt-1 text-xs text-texto-2">
          Lo canceló {entrada.usuario.nombre} el {formatearFechaCorta(entrada.fecha, ahora)}.
        </p>
      )}
    </div>
  )
}

function EnlaceEquipo({ ticket }) {
  return (
    <Link to={`/admin/equipos/${ticket.equipo.id}`} className={`${ESTILO_ENLACE} mt-3`}>
      Ver historial de este equipo →
    </Link>
  )
}

function TextoTecnico({ ticket }) {
  if (ticket.tecnico) return ticket.tecnico.nombre
  return <span className="font-normal text-texto-2">{esActivo(ticket) ? 'Sin asignar' : 'Sin técnico'}</span>
}

function Informacion({ ticket, ahora }) {
  const activo = esActivo(ticket)
  const vencido = activo && calcularSemaforo(ticket, ahora) === 'VENCIDO'
  const sumados = ticket.sumados ?? []

  return (
    <Card titulo="Información">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Dato etiqueta="Ubicación">{formatearUbicacion(ticket.equipo.ubicacion)}</Dato>
        <Dato etiqueta="Categoría">
          {ticket.categoria.nombre} · objetivo {ticket.categoria.horasObjetivo} h
        </Dato>
        <Dato etiqueta="Reportó">
          {ticket.reporta.nombre} · {ticket.reporta.tipo}
        </Dato>
        <Dato etiqueta="Técnico">
          <TextoTecnico ticket={ticket} />
        </Dato>
        <Dato etiqueta="Creado">{formatearFechaCompleta(ticket.creadoEn)}</Dato>
        <Dato etiqueta="Vence">
          <span className={vencido ? 'text-peligro' : ''}>
            {formatearFechaCompleta(ticket.venceEn)}
            {vencido && <span className="sr-only"> (vencido)</span>}
          </span>
        </Dato>
        <div className="sm:col-span-2">
          <dt className="text-xs text-texto-2">Descripción</dt>
          <dd className="mt-0.5 whitespace-pre-line">{ticket.descripcion}</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Foto src={ticket.fotoReporte} alt={`Foto del reporte del ticket #${ticket.id}`} etiqueta="Foto del reporte" />
        <Foto
          src={ticket.fotoCierre}
          alt={`Foto de cierre del ticket #${ticket.id}`}
          etiqueta="Foto de cierre"
          textoVacio={activo ? 'Pendiente: se sube al cerrar' : 'Sin foto'}
        />
      </div>

      {sumados.length > 0 && (
        <p className="mt-4 rounded-lg bg-crema px-3 py-2">
          <span className="font-semibold">{textoSumados(sumados.length)}</span>
          <span className="text-texto-2"> ({sumados.map((p) => p.nombre).join(', ')})</span>
        </p>
      )}

      <EnlaceEquipo ticket={ticket} />
    </Card>
  )
}

function AntesYDespues({ ticket, ahora }) {
  return (
    <Card titulo="Antes y después">
      <div className="grid gap-4 sm:grid-cols-2">
        <Foto
          src={ticket.fotoReporte}
          alt={`Foto del reporte del ticket #${ticket.id}`}
          etiqueta={`Foto del reporte · ${formatearFechaCorta(ticket.creadoEn, ahora)}`}
        />
        <Foto
          src={ticket.fotoCierre}
          alt={`Foto de cierre del ticket #${ticket.id}`}
          etiqueta={`Foto de cierre · ${formatearFechaCorta(ticket.cerradoEn, ahora)}`}
        />
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Dato etiqueta="Ubicación">{formatearUbicacion(ticket.equipo.ubicacion)}</Dato>
        <Dato etiqueta="Categoría">
          {ticket.categoria.nombre} · objetivo {ticket.categoria.horasObjetivo} h
        </Dato>
        <Dato etiqueta="Reportó">
          {ticket.reporta.nombre} · {ticket.reporta.tipo}
        </Dato>
        <Dato etiqueta="Técnico">
          <TextoTecnico ticket={ticket} />
        </Dato>
        <div className="sm:col-span-2">
          <dt className="text-xs text-texto-2">Qué se hizo (técnico)</dt>
          <dd className="mt-0.5 whitespace-pre-line">{ticket.comentarioCierre || 'Sin comentario.'}</dd>
        </div>
      </dl>

      <EnlaceEquipo ticket={ticket} />
    </Card>
  )
}

function DetalleCargando() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Cargando ticket…</span>
      <Skeleton className="h-3 w-24" />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-6 w-40 rounded-full" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 rounded-xl border border-borde bg-tarjeta p-5">
          <Skeleton className="h-4 w-32" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-4 rounded-xl border border-borde bg-tarjeta p-5">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- Página ----------

export default function DetalleTicket() {
  const { id } = useParams()
  const location = useLocation()
  const refTitulo = useRef(null)

  // Si se llegó desde la lista, "Tickets" regresa a ella con los mismos filtros
  const volverA = `/admin/tickets${location.state?.lista ?? ''}`

  const cargar = useCallback(() => getTicket(id), [id])
  const { datos: ticket, cargando, error, recibidoEn: ahora, reintentar, reemplazar } = useDatos(cargar)

  const alActualizar = useCallback(
    (actualizado) => {
      reemplazar(actualizado)
      // Si las acciones desaparecen (ticket cancelado), el foco no se pierde
      requestAnimationFrame(() => {
        if (!document.activeElement || document.activeElement === document.body) refTitulo.current?.focus()
      })
    },
    [reemplazar],
  )

  if (cargando) return <DetalleCargando />

  if (error?.status === 404) {
    return (
      <Card className="mx-auto max-w-md">
        <EmptyState
          titulo="Este ticket no existe"
          mensaje={`No encontramos el ticket #${id}. Revisa el número o búscalo en la lista.`}
          accion={
            <Link
              to="/admin/tickets"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-negro px-4 text-base font-semibold hover:bg-negro/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro"
            >
              Ir a la lista de tickets
            </Link>
          }
        />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <div role="alert">
          <p className="text-base font-semibold">No se pudo cargar el ticket</p>
          <p className="mt-1 text-texto-2">{error.message}</p>
        </div>
        <Button variante="secundario" className="mt-4" onClick={reintentar}>
          Reintentar
        </Button>
      </Card>
    )
  }

  const encabezado = <Encabezado ticket={ticket} ahora={ahora} volverA={volverA} refTitulo={refTitulo} />

  if (ticket.estado === 'CERRADO') {
    return (
      <div className="space-y-6">
        {encabezado}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <AntesYDespues ticket={ticket} ahora={ahora} />
          <HistorialTicket ticket={ticket} ahora={ahora} tituloTarjeta="Historial" nota={NOTA_CERRADO} />
        </div>
      </div>
    )
  }

  if (ticket.estado === 'CANCELADO') {
    return (
      <div className="space-y-6">
        {encabezado}
        <FranjaCancelado ticket={ticket} ahora={ahora} />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Informacion ticket={ticket} ahora={ahora} />
          <HistorialTicket ticket={ticket} ahora={ahora} tituloTarjeta="Historial" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {encabezado}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Informacion ticket={ticket} ahora={ahora} />
        <SiguientePaso ticket={ticket} onActualizado={alActualizar} />
      </div>
      <HistorialTicket ticket={ticket} ahora={ahora} />
    </div>
  )
}
