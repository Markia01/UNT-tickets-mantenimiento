'use client'

import Link from 'next/link'
import { Suspense, useCallback } from 'react'
import { getMisTickets } from '@/api/tecnico.js'
import CargandoPagina from '@/components/layout/CargandoPagina.jsx'
import { IconoHerramienta, IconoTipoEquipo } from '@/components/layout/iconos.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import Button from '@/components/ui/Button.jsx'
import Card from '@/components/ui/Card.jsx'
import EmptyState from '@/components/ui/EmptyState.jsx'
import Pestanas from '@/components/ui/Pestanas.jsx'
import Skeleton from '@/components/ui/Skeleton.jsx'
import { PillTiempo } from '@/components/tickets/piezas.jsx'
import { useDatos } from '@/hooks/useDatos.js'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl.js'
import { formatearFecha } from '@/utils/fechas.js'
import { formatearUbicacion } from '@/utils/ticket.js'
import { guardarLista } from '@/utils/volverALista.js'

const VISTAS = [
  { valor: 'asignados', texto: 'Asignados' },
  { valor: 'proceso', texto: 'En proceso' },
  { valor: 'cerrados', texto: 'Cerrados recientes' },
]

const TEXTO_ORDEN = {
  asignados: 'Por vencimiento: los más urgentes primero. Márcalos en proceso cuando empieces.',
  proceso: 'Por vencimiento: los más urgentes primero. Ciérralos con una foto del arreglo.',
  cerrados: 'Los que cerraste en los últimos 7 días, del más reciente al más antiguo.',
}

const VACIO = {
  asignados: { titulo: 'No tienes tickets asignados', mensaje: 'Cuando mantenimiento te asigne uno, aparecerá aquí.' },
  proceso: { titulo: 'No tienes tickets en proceso', mensaje: 'Marca un ticket asignado en proceso cuando empieces a atenderlo.' },
  cerrados: { titulo: 'No has cerrado tickets esta semana', mensaje: 'Los tickets que cierres aparecerán aquí durante 7 días.' },
}

function TarjetaTicket({ ticket, ahora, alAbrir }) {
  const cerrado = ticket.estado === 'CERRADO'
  return (
    <li>
      <Link
        href={`/tecnico/tickets/${ticket.id}`}
        onClick={alAbrir}
        className="flex h-full flex-col gap-2 rounded-xl border border-borde bg-tarjeta p-4 hover:border-borde-campo hover:bg-campo focus-visible:outline-2 focus-visible:outline-negro"
      >
        <span className="flex items-start gap-3">
          <IconoTipoEquipo tipo={ticket.equipo.tipo} className="mt-0.5 size-6 text-texto-2" />
          <span className="min-w-0 flex-1">
            <span className="block font-bold">
              #{ticket.id} · {ticket.equipo.tipo}
            </span>
            <span className="block text-texto-2">{formatearUbicacion(ticket.equipo.ubicacion)}</span>
          </span>
        </span>
        <span>
          <PillTiempo ticket={ticket} ahora={ahora} />
        </span>
        <span className="line-clamp-2 text-texto-2">{ticket.descripcion}</span>
        <span className="mt-auto border-t border-fondo pt-2 text-xs text-texto-2">
          {ticket.categoria.nombre} ·{' '}
          {cerrado ? `Cerrado ${formatearFecha(ticket.cerradoEn, ahora)}` : `Vence ${formatearFecha(ticket.venceEn, ahora)}`}
        </span>
      </Link>
    </li>
  )
}

function ListaCargando() {
  return (
    <div role="status" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <span className="sr-only">Cargando tus tickets…</span>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-2.5 rounded-xl border border-borde bg-tarjeta p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-5 w-32 rounded-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function MisTickets() {
  const { params, actualizar, consulta } = useFiltrosUrl()
  const vistaUrl = params.get('vista')
  const vista = VISTAS.some((v) => v.valor === vistaUrl) ? vistaUrl : 'asignados'

  const cargar = useCallback(() => getMisTickets({ vista }), [vista])
  const { datos, cargando, error, recibidoEn: ahora, reintentar } = useDatos(cargar)

  // El detalle regresa a esta lista con la misma pestaña
  const alAbrir = () => guardarLista('tecnico', consulta)

  let contenido
  if (cargando) {
    contenido = <ListaCargando />
  } else if (error) {
    contenido = (
      <Card className="text-center">
        <div role="alert">
          <p className="text-base font-semibold">No se pudieron cargar tus tickets</p>
          <p className="mt-1 text-texto-2">{error.message}</p>
        </div>
        <Button variante="secundario" className="mt-4" onClick={reintentar}>
          Reintentar
        </Button>
      </Card>
    )
  } else if (datos.datos.length === 0) {
    contenido = (
      <Card>
        <EmptyState icono={<IconoHerramienta />} titulo={VACIO[vista].titulo} mensaje={VACIO[vista].mensaje} />
      </Card>
    )
  } else {
    contenido = (
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {datos.datos.map((t) => (
          <TarjetaTicket key={t.id} ticket={t} ahora={ahora} alAbrir={alAbrir} />
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader titulo="Mis tickets" />
      <Pestanas
        etiqueta="Vista"
        opciones={VISTAS}
        valor={vista}
        conteos={datos?.conteos}
        onCambiar={(valor) => actualizar({ vista: valor === 'asignados' ? null : valor })}
        className="grid grid-cols-2 sm:flex"
      />
      <p className="text-xs text-texto-2">{TEXTO_ORDEN[vista]}</p>
      <div aria-live="polite" className="sr-only">
        {!cargando && datos && `${datos.datos.length} tickets`}
      </div>
      {contenido}
    </div>
  )
}

// useSearchParams (vía useFiltrosUrl) necesita un <Suspense> alrededor
export default function Pagina() {
  return (
    <Suspense fallback={<CargandoPagina />}>
      <MisTickets />
    </Suspense>
  )
}
