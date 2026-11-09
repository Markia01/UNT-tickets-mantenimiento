import { useCallback, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { getConfiguracion, getEquipo } from '../../api/equipos.js'
import { getCatalogos } from '../../api/tickets.js'
import { IconoAdvertencia, IconoTickets, IconoTipoEquipo } from '../../components/layout/iconos.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Pill from '../../components/ui/Pill.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import { useToast } from '../../components/ui/useToast.js'
import { useDatos } from '../../hooks/useDatos.js'
import { formatearDia, formatearDuracion, formatearHoras } from '../../utils/fechas.js'
import { calcularSemaforo, esActivo, ETIQUETA_SEMAFORO } from '../../utils/semaforo.js'
import { ETIQUETA_ESTADO, formatearUbicacion } from '../../utils/ticket.js'
import ModalEquipo from './equipos/ModalEquipo.jsx'

const ESTILO_BOTON_ENLACE =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-negro px-4 text-base font-semibold hover:bg-negro/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro'

// ---------- Celdas de la tabla de tickets ----------

function Tecnico({ ticket }) {
  if (ticket.tecnico) return ticket.tecnico.nombre
  if (esActivo(ticket)) return <span className="text-texto-2">Sin asignar</span>
  return (
    <span className="text-texto-2">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Sin técnico</span>
    </span>
  )
}

function Atencion({ ticket }) {
  if (ticket.estado === 'CERRADO') return formatearDuracion(ticket.creadoEn, ticket.cerradoEn)
  return (
    <span className="text-texto-2">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Sin cerrar</span>
    </span>
  )
}

// Activos: semáforo con el estado ("Abierto · vencido"); cerrados y cancelados: su estado
function Estado({ ticket, ahora }) {
  const semaforo = calcularSemaforo(ticket, ahora)
  if (!semaforo) return <Pill tipo="estado" valor={ticket.estado} />
  return (
    <Pill tipo="semaforo" valor={semaforo}>
      {ETIQUETA_ESTADO[ticket.estado]} · {ETIQUETA_SEMAFORO[semaforo].toLowerCase()}
    </Pill>
  )
}

// ---------- Secciones ----------

function Ficha({ equipo, onEditar }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-borde bg-tarjeta p-5 sm:flex-row sm:items-center">
      <span
        aria-hidden="true"
        className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-negro text-crema"
      >
        <IconoTipoEquipo tipo={equipo.tipo} className="size-8" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-[26px] leading-tight font-bold">{equipo.tipo}</h2>
          <Pill tipo="equipo" valor={equipo.estado} />
        </div>
        <p className="mt-1 text-texto-2">
          {formatearUbicacion(equipo.ubicacion)} · {equipo.descripcion}
        </p>
      </div>
      <Button variante="secundario" onClick={onEditar} className="w-full sm:w-auto">
        Editar equipo
      </Button>
    </section>
  )
}

function AvisoReemplazo({ fallas, regla }) {
  return (
    <div className="flex gap-3 rounded-xl border border-aviso-punto/60 bg-aviso-fondo p-4 text-aviso-texto">
      <IconoAdvertencia className="mt-0.5 size-5" />
      <div>
        <p>
          <strong>
            Este equipo ha fallado {fallas} veces en los últimos {regla.dias} días.
          </strong>{' '}
          Considera solicitar su reemplazo en lugar de seguir reparándolo.
        </p>
        <p className="mt-1 text-xs">
          Regla: {regla.fallas} o más fallas en {regla.dias} días. Se ajusta en{' '}
          <Link
            to="/admin/categorias"
            className="font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-aviso-texto"
          >
            Categorías
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

function TicketsDelEquipo({ tickets, ahora }) {
  if (tickets.length === 0) {
    return (
      <Card titulo="Tickets de este equipo">
        <EmptyState
          icono={<IconoTickets className="size-6" />}
          titulo="Este equipo no tiene tickets"
          mensaje="Cuando alguien reporte una falla de este equipo, aparecerá aquí."
        />
      </Card>
    )
  }

  return (
    <Card titulo="Tickets de este equipo">
      {/* Escritorio: tabla */}
      <table className="hidden w-full border-separate border-spacing-0 text-left lg:table">
        <caption className="sr-only">Tickets de este equipo, del más reciente al más antiguo</caption>
        <thead>
          <tr>
            {['ID', 'Fecha', 'Falla reportada', 'Técnico', 'Atención', 'Estado'].map((titulo) => (
              <th
                key={titulo}
                scope="col"
                className="bg-negro px-3 py-3 text-xs font-semibold tracking-wide text-crema uppercase first:rounded-l-lg last:rounded-r-lg"
              >
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.id} className="[&:last-child>td]:border-b-0">
              <td className="border-b border-borde px-3 py-3">
                <Link
                  to={`/admin/tickets/${t.id}`}
                  className="font-bold underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro"
                >
                  #{t.id}
                </Link>
              </td>
              <td className="border-b border-borde px-3 py-3 whitespace-nowrap">{formatearDia(t.creadoEn)}</td>
              <td className="max-w-xs border-b border-borde px-3 py-3">
                <span className="block truncate" title={t.descripcion}>
                  {t.descripcion}
                </span>
              </td>
              <td className="border-b border-borde px-3 py-3">
                <Tecnico ticket={t} />
              </td>
              <td className="border-b border-borde px-3 py-3">
                <Atencion ticket={t} />
              </td>
              <td className="border-b border-borde px-3 py-3">
                <Estado ticket={t} ahora={ahora} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Celular: tarjetas */}
      <ul className="space-y-3 lg:hidden">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link
              to={`/admin/tickets/${t.id}`}
              className="block rounded-xl border border-borde bg-campo p-4 hover:border-borde-campo focus-visible:outline-2 focus-visible:outline-negro"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="font-bold">
                  #{t.id} · {formatearDia(t.creadoEn)}
                </span>
                <Estado ticket={t} ahora={ahora} />
              </span>
              <span className="mt-1 line-clamp-2 block text-texto-2">{t.descripcion}</span>
              <span className="mt-1 block">
                <Tecnico ticket={t} /> · Atención: <Atencion ticket={t} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function HistorialCargando() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Cargando historial del equipo…</span>
      <Skeleton className="h-3 w-48" />
      <div className="flex items-center gap-4 rounded-xl border border-borde bg-tarjeta p-5">
        <Skeleton className="size-16 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-xl border border-borde bg-tarjeta p-5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-4 rounded-xl border border-borde bg-tarjeta p-5">
        <Skeleton className="h-4 w-44" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    </div>
  )
}

// ---------- Página ----------

export default function HistorialEquipo() {
  const { id } = useParams()
  const location = useLocation()
  const toast = useToast()

  // Si se llegó desde la lista, "Equipos" regresa a ella con los mismos filtros
  const volverA = `/admin/equipos${location.state?.lista ?? ''}`

  const cargar = useCallback(() => getEquipo(id), [id])
  const { datos, cargando, error, recibidoEn: ahora, reintentar, reemplazar } = useDatos(cargar)
  const { datos: configuracion } = useDatos(getConfiguracion)
  const { datos: catalogos } = useDatos(getCatalogos)
  const regla = configuracion?.reemplazo

  const [editando, setEditando] = useState(false)

  if (cargando) return <HistorialCargando />

  if (error?.status === 404) {
    return (
      <Card className="mx-auto max-w-md">
        <EmptyState
          titulo="Este equipo no existe"
          mensaje="Puede que se haya escrito mal el enlace. Búscalo en la lista de equipos."
          accion={
            <Link to="/admin/equipos" className={ESTILO_BOTON_ENLACE}>
              Ir a Equipos
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
          <p className="text-base font-semibold">No se pudo cargar el historial del equipo</p>
          <p className="mt-1 text-texto-2">{error.message}</p>
        </div>
        <Button variante="secundario" className="mt-4" onClick={reintentar}>
          Reintentar
        </Button>
      </Card>
    )
  }

  const { equipo, estadisticas, tickets } = datos
  const alcanzaRegla = regla && estadisticas.fallasUltimos90 >= regla.fallas

  function alGuardar(guardado) {
    setEditando(false)
    reemplazar({ ...datos, equipo: guardado })
    toast.exito('Equipo actualizado')
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Ruta de navegación">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-texto-2">
          <li>
            <Link
              to={volverA}
              className="text-negro underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro"
            >
              Equipos
            </Link>
          </li>
          <li aria-current="page">
            <span aria-hidden="true">/ </span>
            {equipo.tipo} · {equipo.ubicacion.aula}
          </li>
        </ol>
      </nav>

      <Ficha equipo={equipo} onEditar={() => setEditando(true)} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard etiqueta="Fallas totales" valor={estadisticas.fallasTotales} />
        <StatCard
          etiqueta="Tiempo promedio de atención"
          valor={estadisticas.tiempoPromedioHoras === null ? '—' : formatearHoras(estadisticas.tiempoPromedioHoras)}
          nota={
            estadisticas.tiempoPromedioHoras === null
              ? 'Aún no hay tickets cerrados'
              : 'Del reporte al cierre, solo tickets cerrados'
          }
        />
        <StatCard
          etiqueta="Última falla"
          valor={estadisticas.ultimaFalla ? formatearDia(estadisticas.ultimaFalla) : '—'}
          nota={estadisticas.ultimaFalla ? undefined : 'Sin fallas registradas'}
        />
      </div>

      {alcanzaRegla && <AvisoReemplazo fallas={estadisticas.fallasUltimos90} regla={regla} />}

      <TicketsDelEquipo tickets={tickets} ahora={ahora} />

      <ModalEquipo
        abierto={editando}
        equipo={equipo}
        catalogos={catalogos}
        onCerrar={() => setEditando(false)}
        onGuardado={alGuardar}
      />
    </div>
  )
}
