import { Link } from 'react-router'
import { getResumen } from '../../api/admin.js'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Pill from '../../components/ui/Pill.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import { IconoPalomita } from '../../components/layout/iconos.jsx'
import { useDatos } from '../../hooks/useDatos.js'
import { fechaISOLocal, formatearFechaInicio, inicioDeSemana } from '../../utils/fechas.js'
import { calcularSemaforo } from '../../utils/semaforo.js'
import { formatearUbicacion } from '../../utils/ticket.js'

// Regla de reemplazo: 4 o más fallas en 90 días
const FALLAS_REEMPLAZO = 4

const ESTILO_ENLACE =
  'inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro'

const ESTILO_FILA_ENLACE =
  '-mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2 py-3 hover:bg-crema focus-visible:outline-2 focus-visible:outline-negro'

const textoTickets = (n) => `${n} ${n === 1 ? 'ticket' : 'tickets'}`

function RequierenAtencion({ tickets, ahora }) {
  return (
    <Card titulo="Requieren atención" subtitulo="Vencidos, por vencer o sin técnico · máximo 5">
      {tickets.length === 0 ? (
        <EmptyState
          icono={<IconoPalomita className="size-6" />}
          titulo="Todo al día"
          mensaje="No hay tickets vencidos, por vencer ni sin técnico."
        />
      ) : (
        <ul className="divide-y divide-borde">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link to={`/admin/tickets/${t.id}`} className={ESTILO_FILA_ENLACE}>
                <span className="w-10 shrink-0 font-bold">#{t.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{t.equipo.tipo}</span>
                  <span className="text-texto-2">
                    {' · '}
                    {formatearUbicacion(t.equipo.ubicacion)}
                    {' · '}
                    {t.tecnico?.nombre ?? 'Sin técnico'}
                  </span>
                </span>
                <Pill tipo="semaforo" valor={calcularSemaforo(t, ahora)} className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to="/admin/tickets" className={`${ESTILO_ENLACE} mt-2`}>
        Ver todos en Tickets →
      </Link>
    </Card>
  )
}

function ActividadReciente({ actividad, ahora }) {
  return (
    <Card titulo="Actividad reciente">
      {actividad.length === 0 ? (
        <EmptyState titulo="Sin actividad todavía" mensaje="Aquí aparecerán los últimos cambios en los tickets." />
      ) : (
        <ul className="divide-y divide-borde">
          {actividad.map((a, i) => (
            <li key={`${a.ticketId}-${a.fecha}-${i}`} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
              <time dateTime={a.fecha} className="w-24 shrink-0 text-xs text-texto-2">
                {formatearFechaInicio(a.fecha, ahora)}
              </time>
              <p>
                <Link
                  to={`/admin/tickets/${a.ticketId}`}
                  className="font-bold hover:underline focus-visible:outline-2 focus-visible:outline-negro"
                >
                  #{a.ticketId}
                </Link>{' '}
                {a.texto}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function BarraCarga({ nombre, valor, maximo, peligro = false }) {
  const porcentaje = maximo > 0 ? Math.round((valor / maximo) * 100) : 0
  return (
    <li>
      <div className={`flex items-baseline justify-between gap-3 ${peligro ? 'text-peligro' : ''}`}>
        <span className="truncate font-semibold">{nombre}</span>
        <span className="shrink-0">{textoTickets(valor)}</span>
      </div>
      <div aria-hidden="true" className="mt-1.5 h-2 overflow-hidden rounded-full bg-borde/70">
        <div
          className={`h-full rounded-full ${peligro ? 'bg-error-punto' : 'bg-negro'}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </li>
  )
}

function CargaTecnicos({ carga, sinAsignar }) {
  const maximo = Math.max(sinAsignar, ...carga.map((c) => c.activos), 1)
  return (
    <Card titulo="Carga por técnico">
      {carga.length === 0 ? (
        <EmptyState titulo="No hay técnicos registrados" mensaje="Da de alta técnicos en Usuarios." />
      ) : (
        <ul className="space-y-3">
          {carga.map((c) => (
            <BarraCarga key={c.tecnico.id} nombre={c.tecnico.nombre} valor={c.activos} maximo={maximo} />
          ))}
          <BarraCarga nombre="Sin asignar" valor={sinAsignar} maximo={maximo} peligro />
        </ul>
      )}
      <p className="mt-4 text-xs text-texto-2">Ayuda a decidir a quién asignar el siguiente ticket.</p>
    </Card>
  )
}

function EquiposMasFallas({ equipos }) {
  return (
    <Card titulo="Equipos con más fallas" subtitulo="Últimos 90 días">
      {equipos.length === 0 ? (
        <EmptyState titulo="Sin fallas" mensaje="Ningún equipo tiene fallas en los últimos 90 días." />
      ) : (
        <>
          <ol className="divide-y divide-borde">
            {equipos.map(({ equipo, fallas }, i) => {
              const reemplazo = fallas >= FALLAS_REEMPLAZO
              return (
                <li key={equipo.id}>
                  <Link to={`/admin/equipos/${equipo.id}`} className={ESTILO_FILA_ENLACE}>
                    <span
                      aria-hidden="true"
                      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-negro text-xs font-bold text-crema"
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{equipo.tipo}</span>
                      <span className="block truncate text-xs text-texto-2">
                        {formatearUbicacion(equipo.ubicacion)}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        reemplazo ? 'bg-error-fondo text-error-texto' : 'bg-borde text-negro'
                      }`}
                    >
                      {fallas}
                      <span className="sr-only">
                        {fallas === 1 ? ' falla' : ' fallas'}
                        {reemplazo ? ', cumple la regla de reemplazo' : ''}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
          {equipos.some((e) => e.fallas >= FALLAS_REEMPLAZO) && (
            <p className="mt-2 text-xs text-texto-2" aria-hidden="true">
              En rojo: {FALLAS_REEMPLAZO} o más fallas, se sugiere evaluar su reemplazo.
            </p>
          )}
        </>
      )}
      <Link to="/admin/equipos" className={`${ESTILO_ENLACE} mt-2`}>
        Ver todos los equipos →
      </Link>
    </Card>
  )
}

function InicioCargando() {
  const tarjeta = (lineas) => (
    <div className="rounded-xl border border-borde bg-tarjeta p-5">
      <Skeleton className="mb-5 h-4 w-40" />
      <div className="space-y-4">
        {Array.from({ length: lineas }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  )

  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Cargando resumen…</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-borde bg-tarjeta p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-12" />
            <Skeleton className="mt-3 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {tarjeta(5)}
          {tarjeta(5)}
        </div>
        <div className="space-y-6">
          {tarjeta(3)}
          {tarjeta(3)}
        </div>
      </div>
    </div>
  )
}

export default function Inicio() {
  const { datos, cargando, error, recibidoEn: ahora, reintentar } = useDatos(getResumen)

  if (cargando) return <InicioCargando />

  if (error) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <div role="alert">
          <p className="text-base font-semibold">No se pudo cargar el resumen</p>
          <p className="mt-1 text-texto-2">{error.message}</p>
        </div>
        <Button variante="secundario" className="mt-4" onClick={reintentar}>
          Reintentar
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard etiqueta="Activos" valor={datos.activos} a="/admin/tickets?vista=activos" />
        <StatCard
          etiqueta="Cerrados esta semana"
          valor={datos.cerradosSemana}
          a={`/admin/tickets?vista=cerrados&desde=${fechaISOLocal(inicioDeSemana(ahora))}`}
        />
        <StatCard
          etiqueta="Vencidos"
          valor={datos.vencidos}
          a="/admin/tickets?vista=activos&tiempo=VENCIDO"
          peligro={datos.vencidos > 0}
        />
        <StatCard etiqueta="Sin asignar" valor={datos.sinAsignar} a="/admin/tickets?vista=activos&tecnico=sin" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <RequierenAtencion tickets={datos.requierenAtencion} ahora={ahora} />
          <ActividadReciente actividad={datos.actividadReciente} ahora={ahora} />
        </div>
        <div className="min-w-0 space-y-6">
          <CargaTecnicos carga={datos.cargaTecnicos} sinAsignar={datos.sinAsignar} />
          <EquiposMasFallas equipos={datos.equiposMasFallas} />
        </div>
      </div>
    </div>
  )
}
