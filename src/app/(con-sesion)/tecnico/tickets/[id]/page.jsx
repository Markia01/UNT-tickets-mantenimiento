'use client'

import { useParams } from 'next/navigation'
import { Suspense, useCallback, useRef, useState } from 'react'
import { getTicket } from '@/api/tickets.js'
import CargandoPagina from '@/components/layout/CargandoPagina.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import Card from '@/components/ui/Card.jsx'
import Pill from '@/components/ui/Pill.jsx'
import Skeleton from '@/components/ui/Skeleton.jsx'
import ErrorTicket from '@/components/tickets/ErrorTicket.jsx'
import HistorialTicket from '@/components/tickets/HistorialTicket.jsx'
import { Dato, Foto, PillTiempo } from '@/components/tickets/piezas.jsx'
import { useDatos } from '@/hooks/useDatos.js'
import { formatearFechaCompleta } from '@/utils/fechas.js'
import { calcularSemaforo, esActivo } from '@/utils/semaforo.js'
import { formatearUbicacion } from '@/utils/ticket.js'
import { leerLista } from '@/utils/volverALista.js'
import AccionesTecnico from './_componentes/AccionesTecnico.jsx'

// Siguiente paso contado desde el punto de vista del técnico
const PASOS_TECNICO = {
  ASIGNADO: 'Siguiente paso: márcalo en proceso cuando empieces',
  EN_PROCESO: 'Siguiente paso: ciérralo con una foto del arreglo',
}

function Informacion({ ticket, ahora }) {
  const vencido = esActivo(ticket) && calcularSemaforo(ticket, ahora) === 'VENCIDO'
  const sumados = ticket.sumados ?? []

  return (
    <Card titulo="Información">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Dato etiqueta="Ubicación">{formatearUbicacion(ticket.equipo.ubicacion)}</Dato>
        <Dato etiqueta="Equipo">
          {ticket.equipo.tipo}
          <span className="block text-xs font-normal text-texto-2">{ticket.equipo.descripcion}</span>
        </Dato>
        <Dato etiqueta="Categoría">
          {ticket.categoria.nombre} · objetivo {ticket.categoria.horasObjetivo} h
        </Dato>
        <Dato etiqueta="Reportó">
          {ticket.reporta.nombre}
          {ticket.reporta.tipo && <span className="font-normal text-texto-2"> · {ticket.reporta.tipo}</span>}
        </Dato>
        <Dato etiqueta="Creado">{formatearFechaCompleta(ticket.creadoEn)}</Dato>
        <Dato etiqueta="Vence">
          <span className={vencido ? 'text-peligro' : ''}>
            {formatearFechaCompleta(ticket.venceEn)}
            {vencido && <span className="sr-only"> (vencido)</span>}
          </span>
        </Dato>
        <Dato etiqueta="También lo reportaron" className="sm:col-span-2">
          {sumados.length > 0 ? (
            sumados.map((p) => p.nombre).join(', ')
          ) : (
            <span className="font-normal text-texto-2">Nadie más</span>
          )}
        </Dato>
        <div className="sm:col-span-2">
          <dt className="text-xs text-texto-2">Descripción</dt>
          <dd className="mt-0.5 whitespace-pre-line">{ticket.descripcion}</dd>
        </div>
      </dl>

      <div className="mt-5 sm:max-w-sm">
        <Foto src={ticket.fotoReporte} alt={`Foto del reporte del ticket #${ticket.id}`} etiqueta="Foto del reporte" />
      </div>
    </Card>
  )
}

function Cargando() {
  return (
    <div role="status" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <span className="sr-only">Cargando ticket…</span>
      <div className="space-y-4 rounded-xl border border-borde bg-tarjeta p-5">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-lg sm:max-w-sm" />
      </div>
      <div className="space-y-4 rounded-xl border border-borde bg-tarjeta p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  )
}

function AtenderTicket() {
  const { id } = useParams()
  const refTitulo = useRef(null)
  const [volverA] = useState(() => `/tecnico${leerLista('tecnico')}`)

  const cargar = useCallback(() => getTicket(id), [id])
  const { datos: ticket, cargando, error, recibidoEn: ahora, reintentar, reemplazar } = useDatos(cargar)

  const alActualizar = useCallback(
    (actualizado) => {
      reemplazar(actualizado)
      // El botón o el formulario que tenía el foco desaparece: el foco pasa al título
      requestAnimationFrame(() => refTitulo.current?.focus())
    },
    [reemplazar],
  )

  const ruta = [{ texto: 'Mis tickets', a: volverA }, { texto: `#${id}` }]

  if (cargando || error) {
    return (
      <>
        <PageHeader titulo={`Ticket #${id}`} ruta={ruta} />
        {cargando ? (
          <Cargando />
        ) : (
          <ErrorTicket
            id={id}
            error={error}
            reintentar={reintentar}
            palabra="ticket"
            volver={{ href: '/tecnico', texto: 'Ir a Mis tickets' }}
            textoAjeno="Este ticket no está asignado a ti. Si crees que es un error, avisa a mantenimiento."
          />
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`#${ticket.id} · ${ticket.equipo.tipo}`}
        ruta={ruta}
        refTitulo={refTitulo}
        etiquetas={
          <>
            <Pill tipo="estado" valor={ticket.estado} />
            <PillTiempo ticket={ticket} ahora={ahora} />
          </>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Informacion ticket={ticket} ahora={ahora} />
        <AccionesTecnico ticket={ticket} onActualizado={alActualizar} onRecargar={reintentar} />
      </div>
      <HistorialTicket ticket={ticket} ahora={ahora} pasos={PASOS_TECNICO} />
    </div>
  )
}

// useParams necesita un <Suspense> alrededor (Next lo exige al compilar)
export default function Pagina() {
  return (
    <Suspense fallback={<CargandoPagina />}>
      <AtenderTicket />
    </Suspense>
  )
}
