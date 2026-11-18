'use client'

import { useParams } from 'next/navigation'
import { Suspense, useCallback } from 'react'
import { getTicket } from '@/api/tickets.js'
import { IconoPalomita } from '@/components/layout/iconos.jsx'
import CargandoPagina from '@/components/layout/CargandoPagina.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import Card from '@/components/ui/Card.jsx'
import EnlaceBoton from '@/components/ui/EnlaceBoton.jsx'
import Pill from '@/components/ui/Pill.jsx'
import Skeleton from '@/components/ui/Skeleton.jsx'
import ErrorTicket from '@/components/tickets/ErrorTicket.jsx'
import { Dato } from '@/components/tickets/piezas.jsx'
import { useAuth } from '@/context/useAuth.js'
import { useDatos } from '@/hooks/useDatos.js'
import { formatearFechaCompleta } from '@/utils/fechas.js'
import { esActivo } from '@/utils/semaforo.js'
import { formatearUbicacion } from '@/utils/ticket.js'

function Cargando() {
  return (
    <div role="status" className="max-w-xl space-y-4 rounded-xl border border-borde bg-tarjeta p-6">
      <span className="sr-only">Cargando reporte…</span>
      <Skeleton className="size-12 rounded-full" />
      <Skeleton className="h-7 w-56" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

function ReporteEnviado() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const cargar = useCallback(() => getTicket(id), [id])
  const { datos: ticket, cargando, error, reintentar } = useDatos(cargar)

  if (cargando || error) {
    return (
      <>
        <PageHeader titulo="Reporte enviado" />
        {cargando ? (
          <Cargando />
        ) : (
          <ErrorTicket id={id} error={error} reintentar={reintentar} volver={{ href: '/mis-reportes', texto: 'Ir a Mis reportes' }} />
        )}
      </>
    )
  }

  // Si el usuario no lo creó, llegó aquí al sumarse a un reporte que ya existía
  const sumado = ticket.reporta.id !== usuario?.id
  const titulo = sumado ? 'Te sumaste al reporte' : 'Reporte enviado'

  return (
    <>
      <PageHeader titulo={titulo} />
      <Card className="max-w-xl p-6">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ok-fondo text-ok-punto">
            <IconoPalomita className="size-6" />
          </span>
          <div>
            <p className="text-xs font-semibold text-texto-2">Folio</p>
            <p className="text-[32px] leading-tight font-bold">#{ticket.id}</p>
            <p className="mt-1 text-texto-2">
              {sumado
                ? 'Mantenimiento ya sabe que tú también tienes esta falla.'
                : 'Mantenimiento recibió tu reporte. Guarda el folio para darle seguimiento.'}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-4 border-t border-borde pt-5 sm:grid-cols-2">
          <Dato etiqueta="Equipo">
            {ticket.equipo.tipo}
            <span className="block text-xs font-normal text-texto-2">{ticket.equipo.descripcion}</span>
          </Dato>
          <Dato etiqueta="Ubicación">{formatearUbicacion(ticket.equipo.ubicacion)}</Dato>
          <Dato etiqueta="Tipo de falla">{ticket.categoria.nombre}</Dato>
          <Dato etiqueta="Estado">
            <Pill tipo="estado" valor={ticket.estado} />
          </Dato>
          {esActivo(ticket) && (
            <Dato etiqueta="Fecha estimada de atención" className="sm:col-span-2">
              {formatearFechaCompleta(ticket.venceEn)}
              <span className="block text-xs font-normal text-texto-2">
                Mantenimiento busca atender las fallas de {ticket.categoria.nombre.toLowerCase()} en{' '}
                {ticket.categoria.horasObjetivo} horas.
              </span>
            </Dato>
          )}
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <EnlaceBoton href="/mis-reportes">Ver mis reportes</EnlaceBoton>
          <EnlaceBoton href="/reportar" variante="secundario">
            Reportar otra falla
          </EnlaceBoton>
        </div>
      </Card>
    </>
  )
}

// useParams necesita un <Suspense> alrededor (Next lo exige al compilar)
export default function Pagina() {
  return (
    <Suspense fallback={<CargandoPagina />}>
      <ReporteEnviado />
    </Suspense>
  )
}
