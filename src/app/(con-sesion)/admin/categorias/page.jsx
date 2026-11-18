'use client'

import { useState } from 'react'
import { editarCategoria, getCategorias } from '@/api/categorias.js'
import { IconoCategorias, IconoMas } from '@/components/layout/iconos.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import Button from '@/components/ui/Button.jsx'
import Card from '@/components/ui/Card.jsx'
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx'
import EmptyState from '@/components/ui/EmptyState.jsx'
import Pill from '@/components/ui/Pill.jsx'
import Skeleton from '@/components/ui/Skeleton.jsx'
import { useToast } from '@/components/ui/useToast.js'
import { useDatos } from '@/hooks/useDatos.js'
import ModalCategoria from './_componentes/ModalCategoria.jsx'

const NOTA =
  'Las horas objetivo son el tiempo para atender un ticket de esa categoría: con ellas se calcula cuándo vence. Las categorías no se borran; al desactivarlas dejan de aparecer en “Reportar falla” y sus tickets se conservan.'

const textoTickets = (n) => (n === 1 ? '1 ticket activo' : `${n} tickets activos`)

function Estado({ activa }) {
  return (
    <Pill tipo="activo" valor={activa}>
      {activa ? 'Activa' : 'Inactiva'}
    </Pill>
  )
}

function TicketsActivos({ n }) {
  return <span className={n === 0 ? 'text-texto-2' : 'font-semibold'}>{n}</span>
}

const CLASE_ACCION =
  'inline-flex min-h-11 items-center rounded-lg px-2 font-semibold whitespace-nowrap underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro'

function Acciones({ categoria, alAccion, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-1 ${className}`}>
      <button type="button" className={CLASE_ACCION} onClick={() => alAccion('editar', categoria)}>
        Editar<span className="sr-only"> {categoria.nombre}</span>
      </button>
      <button
        type="button"
        className={`${CLASE_ACCION} ${categoria.activa ? 'text-peligro' : ''}`}
        onClick={() => alAccion('activa', categoria)}
      >
        {categoria.activa ? 'Desactivar' : 'Activar'}
        <span className="sr-only"> {categoria.nombre}</span>
      </button>
    </div>
  )
}

function TablaCategorias({ categorias, alAccion }) {
  return (
    <table className="hidden w-full border-separate border-spacing-0 text-left md:table">
      <caption className="sr-only">Categorías</caption>
      <thead>
        <tr>
          {['Nombre', 'Horas objetivo', 'Tickets activos', 'Estado'].map((titulo) => (
            <th
              key={titulo}
              scope="col"
              className="bg-negro px-3 py-3 text-xs font-semibold tracking-wide text-crema uppercase first:rounded-l-lg"
            >
              {titulo}
            </th>
          ))}
          <th scope="col" className="rounded-r-lg bg-negro px-3 py-3">
            <span className="sr-only">Acciones</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {categorias.map((c) => (
          <tr key={c.id} className="hover:bg-crema [&:last-child>td]:border-b-0">
            <td className="border-b border-fondo px-3 py-3 font-semibold">{c.nombre}</td>
            <td className="border-b border-fondo px-3 py-3">{c.horasObjetivo} h</td>
            <td className="border-b border-fondo px-3 py-3">
              <TicketsActivos n={c.ticketsActivos} />
            </td>
            <td className="border-b border-fondo px-3 py-3">
              <Estado activa={c.activa} />
            </td>
            <td className="border-b border-fondo px-3 py-1">
              <Acciones categoria={c} alAccion={alAccion} className="justify-end" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TarjetasCategorias({ categorias, alAccion }) {
  return (
    <ul className="space-y-3 md:hidden">
      {categorias.map((c) => (
        <li key={c.id} className="rounded-xl border border-borde bg-tarjeta p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-bold">{c.nombre}</p>
            <Estado activa={c.activa} />
          </div>
          <p className="mt-1 text-texto-2">
            Objetivo {c.horasObjetivo} h · {textoTickets(c.ticketsActivos)}
          </p>
          <Acciones categoria={c} alAccion={alAccion} className="-mx-2 mt-2 border-t border-fondo pt-1" />
        </li>
      ))}
    </ul>
  )
}

function ListaCargando() {
  return (
    <div role="status" className="md:rounded-xl md:border md:border-borde md:bg-tarjeta md:p-5">
      <span className="sr-only">Cargando categorías…</span>
      <div className="hidden md:block">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-fondo px-3 py-4 last:border-b-0">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2.5 rounded-xl border border-borde bg-tarjeta p-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Categorias() {
  const toast = useToast()
  const { datos: categorias, cargando, error, reintentar } = useDatos(getCategorias)

  // { categoria? } (sin categoria = nueva) | null
  const [modal, setModal] = useState(null)
  const [confirmando, setConfirmando] = useState(null)
  const [procesando, setProcesando] = useState(false)

  function alAccion(accion, categoria) {
    if (accion === 'editar') setModal({ categoria })
    else setConfirmando(categoria)
  }

  function alGuardar(guardada) {
    const editando = Boolean(modal?.categoria)
    setModal(null)
    toast.exito(editando ? 'Cambios guardados' : `Categoría “${guardada.nombre}” creada`)
    reintentar()
  }

  async function cambiarEstado() {
    const categoria = confirmando
    setProcesando(true)
    try {
      const actualizada = await editarCategoria(categoria.id, { activa: !categoria.activa })
      setConfirmando(null)
      toast.exito(`Categoría “${actualizada.nombre}” ${actualizada.activa ? 'activada' : 'desactivada'}`)
      reintentar()
    } catch (error) {
      setConfirmando(null)
      toast.error(error.message || 'No se pudo cambiar el estado. Inténtalo de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader titulo="Categorías" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-texto-2">Tipos de falla que se eligen al reportar y el tiempo para atenderlas.</p>
        <Button onClick={() => setModal({})} className="min-h-12 gap-2 max-sm:w-full">
          <IconoMas className="size-[18px]" />
          Nueva categoría
        </Button>
      </div>

      <section aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="sr-only">
          Lista de categorías
        </h2>

        {cargando ? (
          <ListaCargando />
        ) : error ? (
          <Card className="mx-auto max-w-md text-center">
            <div role="alert">
              <p className="text-base font-semibold">No se pudieron cargar las categorías</p>
              <p className="mt-1 text-texto-2">{error.message}</p>
            </div>
            <Button variante="secundario" className="mt-4" onClick={reintentar}>
              Reintentar
            </Button>
          </Card>
        ) : categorias.length === 0 ? (
          <Card>
            <EmptyState
              icono={<IconoCategorias className="size-6" />}
              titulo="Todavía no hay categorías"
              mensaje="Crea al menos una categoría para que se puedan reportar fallas."
            />
          </Card>
        ) : (
          <div className="md:rounded-xl md:border md:border-borde md:bg-tarjeta md:p-5">
            <TablaCategorias categorias={categorias} alAccion={alAccion} />
            <TarjetasCategorias categorias={categorias} alAccion={alAccion} />
            <p className="mt-4 text-xs leading-relaxed text-texto-2">{NOTA}</p>
          </div>
        )}
      </section>

      <ModalCategoria
        abierto={Boolean(modal)}
        categoria={modal?.categoria}
        onCerrar={() => setModal(null)}
        onGuardado={alGuardar}
      />

      <ConfirmDialog
        abierto={Boolean(confirmando)}
        titulo={
          confirmando &&
          `¿${confirmando.activa ? 'Desactivar' : 'Activar'} la categoría “${confirmando.nombre}”?`
        }
        textoConfirmar={confirmando?.activa ? 'Sí, desactivar' : 'Sí, activar'}
        variante={confirmando?.activa ? 'peligroLleno' : 'principal'}
        cargando={procesando}
        onConfirmar={cambiarEstado}
        onCerrar={() => setConfirmando(null)}
      >
        {confirmando?.activa ? (
          <p>
            Ya no aparecerá al reportar una falla.{' '}
            {confirmando.ticketsActivos > 0
              ? confirmando.ticketsActivos === 1
                ? 'Su ticket activo se conserva y sigue su curso normal.'
                : `Sus ${confirmando.ticketsActivos} tickets activos se conservan y siguen su curso normal.`
              : 'Sus tickets anteriores se conservan.'}
          </p>
        ) : (
          <p>Volverá a aparecer al reportar una falla.</p>
        )}
      </ConfirmDialog>
    </div>
  )
}
