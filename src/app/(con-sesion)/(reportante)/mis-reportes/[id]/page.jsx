'use client'

import { useParams } from 'next/navigation'
import { Suspense, useCallback, useState } from 'react'
import { getTicket } from '@/api/tickets.js'
import CargandoPagina from '@/components/layout/CargandoPagina.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import Card from '@/components/ui/Card.jsx'
import Pill from '@/components/ui/Pill.jsx'
import Skeleton from '@/components/ui/Skeleton.jsx'
import ErrorTicket from '@/components/tickets/ErrorTicket.jsx'
import HistorialTicket from '@/components/tickets/HistorialTicket.jsx'
import { Dato, Foto } from '@/components/tickets/piezas.jsx'
import { useAuth } from '@/context/useAuth.js'
import MarcaSumado from '@/components/tickets/MarcaSumado.jsx'
import { useDatos } from '@/hooks/useDatos.js'
import { leerLista } from '@/utils/volverALista.js'
import { formatearFechaCompleta, formatearFechaCorta } from '@/utils/fechas.js'
import { esActivo } from '@/utils/semaforo.js'
import { formatearUbicacion } from '@/utils/ticket.js'

// Siguiente paso contado desde el punto de vista de quien reporta
const PASOS_REPORTANTE = {
  ABIERTO: 'Siguiente paso: mantenimiento le asigna un técnico',
  ASIGNADO: 'Siguiente paso: el técnico empieza a atenderlo',
  EN_PROCESO: 'Siguiente paso: el técnico lo cierra con una foto del arreglo',
}

const textoSumados = (n) => (n === 1 ? '1 persona más reportó esta falla' : `${n} personas más reportaron esta falla`)

function Cancelado({ ticket, ahora }) {
  return (
    <div role="note" className="rounded-xl border border-borde bg-borde/60 p-4">
      <p>
        <span className="font-semibold">Reporte cancelado:</span> {ticket.motivoCancelacion}.
      </p>
      <p className="mt-1 text-xs text-texto-2">
        Mantenimiento lo canceló el {formatearFechaCorta(ticket.cerradoEn, ahora)}. Si la falla sigue, puedes reportarla de nuevo.
      </p>
    </div>
  )
}

function Informacion({ ticket, usuario, ahora }) {
  const activo = esActivo(ticket)
  const propio = ticket.reporta.id === usuario?.id
  const otros = (ticket.sumados ?? []).filter((p) => p.id !== usuario?.id).length + (propio ? 0 : 1)

  return (
    <Card titulo="Tu reporte">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Dato etiqueta="Equipo">
          {ticket.equipo.tipo}
          <span className="block text-xs font-normal text-texto-2">{ticket.equipo.descripcion}</span>
        </Dato>
        <Dato etiqueta="Ubicación">{formatearUbicacion(ticket.equipo.ubicacion)}</Dato>
        <Dato etiqueta="Tipo de falla">{ticket.categoria.nombre}</Dato>
        <Dato etiqueta="Técnico">
          {ticket.tecnico?.nombre ?? <span className="font-normal text-texto-2">{activo ? 'Por asignar' : 'Sin técnico'}</span>}
        </Dato>
        <Dato etiqueta="Reportado">
          {formatearFechaCompleta(ticket.creadoEn)}
          <span className="block text-xs font-normal text-texto-2">
            {propio ? 'Por ti' : `Por ${ticket.reporta.nombre}; tú te sumaste`}
          </span>
        </Dato>
        {activo ? (
          <Dato etiqueta="Fecha estimada de atención">
            {formatearFechaCompleta(ticket.venceEn)}
            {new Date(ticket.venceEn) < new Date(ahora) && (
              <span className="block text-xs text-peligro">Va con retraso; mantenimiento ya lo tiene en su lista.</span>
            )}
          </Dato>
        ) : (
          <Dato etiqueta={ticket.estado === 'CERRADO' ? 'Cerrado' : 'Cancelado'}>
            {formatearFechaCompleta(ticket.cerradoEn)}
          </Dato>
        )}
        <div className="sm:col-span-2">
          <dt className="text-xs text-texto-2">Descripción</dt>
          <dd className="mt-0.5 whitespace-pre-line">{ticket.descripcion}</dd>
        </div>
      </dl>

      {otros > 0 && (
        <p className="mt-4 rounded-lg bg-crema px-3 py-2 font-semibold">{textoSumados(otros)}</p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Foto src={ticket.fotoReporte} alt={`Foto del reporte #${ticket.id}`} etiqueta="Foto del reporte" />
        {ticket.estado === 'CERRADO' && (
          <Foto src={ticket.fotoCierre} alt={`Foto del arreglo del reporte #${ticket.id}`} etiqueta="Foto de cierre" />
        )}
      </div>

      {ticket.estado === 'CERRADO' && (
        <div className="mt-4">
          <p className="text-xs text-texto-2">Comentario del técnico</p>
          <p className="mt-0.5 whitespace-pre-line">{ticket.comentarioCierre || 'Sin comentario.'}</p>
        </div>
      )}
    </Card>
  )
}

function Cargando() {
  return (
    <div role="status" className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <span className="sr-only">Cargando reporte…</span>
      <div className="space-y-4 rounded-xl border border-borde bg-tarjeta p-5">
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <Skeleton className="aspect-[4/3] w-full rounded-lg sm:w-1/2" />
      </div>
      <div className="space-y-4 rounded-xl border border-borde bg-tarjeta p-5">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

function DetalleReporte() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const cargar = useCallback(() => getTicket(id), [id])
  const { datos: ticket, cargando, error, recibidoEn: ahora, reintentar } = useDatos(cargar)

  // Si se llegó desde la lista, regresa a ella con el mismo filtro
  const [volverA] = useState(() => `/mis-reportes${leerLista('mis-reportes')}`)
  const ruta = [{ texto: 'Mis reportes', a: volverA }, { texto: `#${id}` }]

  if (cargando || error) {
    return (
      <>
        <PageHeader titulo={`Reporte #${id}`} ruta={ruta} />
        {cargando ? (
          <Cargando />
        ) : (
          <ErrorTicket
            id={id}
            error={error}
            reintentar={reintentar}
            volver={{ href: '/mis-reportes', texto: 'Ir a Mis reportes' }}
            textoAjeno="Solo puedes ver los reportes que hiciste o a los que te sumaste."
          />
        )}
      </>
    )
  }

  const sumado = ticket.reporta.id !== usuario?.id

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`#${ticket.id} · ${ticket.equipo.tipo}`}
        ruta={ruta}
        etiquetas={
          <>
            <Pill tipo="estado" valor={ticket.estado} />
            {sumado && <MarcaSumado />}
          </>
        }
      />
      {ticket.estado === 'CANCELADO' && <Cancelado ticket={ticket} ahora={ahora} />}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Informacion ticket={ticket} usuario={usuario} ahora={ahora} />
        <HistorialTicket ticket={ticket} ahora={ahora} tituloTarjeta="Avance" pasos={PASOS_REPORTANTE} />
      </div>
    </div>
  )
}

// useParams necesita un <Suspense> alrededor (Next lo exige al compilar)
export default function Pagina() {
  return (
    <Suspense fallback={<CargandoPagina />}>
      <DetalleReporte />
    </Suspense>
  )
}
