'use client'

import Link from 'next/link'
import { Suspense, useCallback } from 'react'
import { getMisReportes } from '@/api/tickets.js'
import CargandoPagina from '@/components/layout/CargandoPagina.jsx'
import { IconoLista } from '@/components/layout/iconos.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import Button from '@/components/ui/Button.jsx'
import Card from '@/components/ui/Card.jsx'
import EmptyState from '@/components/ui/EmptyState.jsx'
import EnlaceBoton from '@/components/ui/EnlaceBoton.jsx'
import Pestanas from '@/components/ui/Pestanas.jsx'
import Pill from '@/components/ui/Pill.jsx'
import Skeleton from '@/components/ui/Skeleton.jsx'
import MarcaSumado from '@/components/tickets/MarcaSumado.jsx'
import { useDatos } from '@/hooks/useDatos.js'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl.js'
import { guardarLista } from '@/utils/volverALista.js'
import { formatearFecha } from '@/utils/fechas.js'
import { esActivo } from '@/utils/semaforo.js'
import { formatearUbicacion } from '@/utils/ticket.js'

const ESTADOS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'activos', texto: 'Activos' },
  { valor: 'cerrados', texto: 'Cerrados' },
  { valor: 'cancelados', texto: 'Cancelados' },
]

const VACIO_POR_ESTADO = {
  activos: 'No tienes reportes activos.',
  cerrados: 'Todavía no se ha cerrado ninguno de tus reportes.',
  cancelados: 'No tienes reportes cancelados.',
}

// "Atención estimada: 18 nov, 20:49" / "Cerrado el 17 nov" / "Cancelado el 15 nov"
function Seguimiento({ ticket, ahora }) {
  if (esActivo(ticket)) {
    const retrasado = new Date(ticket.venceEn) < new Date(ahora)
    return (
      <>
        Atención estimada: {formatearFecha(ticket.venceEn, ahora)}
        {retrasado && <span className="font-semibold text-peligro"> · con retraso</span>}
      </>
    )
  }
  const verbo = ticket.estado === 'CERRADO' ? 'Cerrado' : 'Cancelado'
  return (
    <>
      {verbo} {formatearFecha(ticket.cerradoEn, ahora)}
    </>
  )
}

function Marca({ ticket }) {
  return ticket.relacion === 'SUMADO' ? <MarcaSumado /> : null
}

function Tabla({ tickets, ahora, alAbrir }) {
  return (
    <table className="hidden w-full border-separate border-spacing-0 text-left lg:table">
      <caption className="sr-only">Mis reportes</caption>
      <thead>
        <tr>
          {['Folio', 'Equipo', 'Ubicación', 'Reportado', 'Estado', 'Seguimiento'].map((titulo) => (
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
          // Toda la fila abre el detalle; con teclado se llega por el enlace del folio
          <tr key={t.id} className="relative hover:bg-crema focus-within:bg-crema [&:last-child>td]:border-b-0">
            <td className="border-b border-fondo px-3 py-3">
              <span className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/mis-reportes/${t.id}`}
                  onClick={alAbrir}
                  className="font-bold underline underline-offset-2 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-negro"
                >
                  #{t.id}
                </Link>
                <Marca ticket={t} />
              </span>
            </td>
            <td className="border-b border-fondo px-3 py-3">
              <span className="font-semibold">{t.equipo.tipo}</span>
              <span className="block text-xs text-texto-2">{t.categoria.nombre}</span>
            </td>
            <td className="border-b border-fondo px-3 py-3">{formatearUbicacion(t.equipo.ubicacion)}</td>
            <td className="border-b border-fondo px-3 py-3">{formatearFecha(t.creadoEn, ahora)}</td>
            <td className="border-b border-fondo px-3 py-3">
              <Pill tipo="estado" valor={t.estado} />
            </td>
            <td className="border-b border-fondo px-3 py-3 text-texto-2">
              <Seguimiento ticket={t} ahora={ahora} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Tarjetas({ tickets, ahora, alAbrir }) {
  return (
    <ul className="space-y-3 lg:hidden">
      {tickets.map((t) => (
        <li key={t.id}>
          <Link
            href={`/mis-reportes/${t.id}`}
            onClick={alAbrir}
            className="block rounded-xl border border-borde bg-tarjeta p-4 hover:border-borde-campo hover:bg-campo focus-visible:outline-2 focus-visible:outline-negro"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="font-bold">
                #{t.id} · {t.equipo.tipo}
              </span>
              <Pill tipo="estado" valor={t.estado} />
            </span>
            <span className="mt-1 block text-texto-2">
              {formatearUbicacion(t.equipo.ubicacion)} · {t.categoria.nombre}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-texto-2">
              <Marca ticket={t} />
              <Seguimiento ticket={t} ahora={ahora} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ListaCargando() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Cargando tus reportes…</span>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2.5 rounded-xl border border-borde bg-tarjeta p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      ))}
    </div>
  )
}

function MisReportes() {
  const { params, actualizar, consulta } = useFiltrosUrl()
  const estadoUrl = params.get('estado')
  const estado = ESTADOS.some((e) => e.valor === estadoUrl) ? estadoUrl : 'todos'

  const cargar = useCallback(() => getMisReportes(Object.fromEntries(new URLSearchParams(consulta))), [consulta])
  const { datos, cargando, error, recibidoEn: ahora, reintentar } = useDatos(cargar)

  // El detalle regresa a la lista con el mismo filtro
  const alAbrir = () => guardarLista('mis-reportes', consulta)

  let contenido
  if (cargando) {
    contenido = <ListaCargando />
  } else if (error) {
    contenido = (
      <Card className="text-center">
        <div role="alert">
          <p className="text-base font-semibold">No se pudieron cargar tus reportes</p>
          <p className="mt-1 text-texto-2">{error.message}</p>
        </div>
        <Button variante="secundario" className="mt-4" onClick={reintentar}>
          Reintentar
        </Button>
      </Card>
    )
  } else if (datos.conteos.todos === 0) {
    contenido = (
      <Card>
        <EmptyState
          icono={<IconoLista />}
          titulo="Aún no tienes reportes"
          mensaje="Cuando reportes una falla o te sumes a un reporte, aparecerá aquí con su avance."
          accion={<EnlaceBoton href="/reportar">Reportar falla</EnlaceBoton>}
        />
      </Card>
    )
  } else if (datos.datos.length === 0) {
    contenido = (
      <Card>
        <EmptyState
          titulo={VACIO_POR_ESTADO[estado]}
          accion={
            <Button variante="secundario" onClick={() => actualizar({ estado: null })}>
              Ver todos
            </Button>
          }
        />
      </Card>
    )
  } else {
    contenido = (
      <div className="lg:rounded-xl lg:border lg:border-borde lg:bg-tarjeta lg:p-5">
        <Tabla tickets={datos.datos} ahora={ahora} alAbrir={alAbrir} />
        <Tarjetas tickets={datos.datos} ahora={ahora} alAbrir={alAbrir} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader titulo="Mis reportes" />
      <p className="text-texto-2">Los reportes que hiciste y aquellos a los que te sumaste, del más reciente al más antiguo.</p>
      <Pestanas
        etiqueta="Estado"
        opciones={ESTADOS}
        valor={estado}
        conteos={datos?.conteos}
        onCambiar={(valor) => actualizar({ estado: valor === 'todos' ? null : valor })}
        className="grid grid-cols-2 sm:flex"
      />
      <div aria-live="polite" className="sr-only">
        {!cargando && datos && `${datos.datos.length} reportes`}
      </div>
      {contenido}
    </div>
  )
}

// useSearchParams (vía useFiltrosUrl) necesita un <Suspense> alrededor
export default function Pagina() {
  return (
    <Suspense fallback={<CargandoPagina />}>
      <MisReportes />
    </Suspense>
  )
}
