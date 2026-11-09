import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { getCatalogos, getTickets } from '../../api/tickets.js'
import { IconoBuscar, IconoCerrar, IconoFiltros } from '../../components/layout/iconos.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Field from '../../components/ui/Field.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Pill from '../../components/ui/Pill.jsx'
import Select from '../../components/ui/Select.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import { useDatos } from '../../hooks/useDatos.js'
import { formatearDuracion } from '../../utils/fechas.js'
import { calcularSemaforo, esActivo, ETIQUETA_SEMAFORO } from '../../utils/semaforo.js'
import { ETIQUETA_ESTADO, formatearUbicacion } from '../../utils/ticket.js'

const VISTAS = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'activos', texto: 'Activos' },
  { valor: 'cerrados', texto: 'Cerrados' },
]

// Filtros que cuentan en "Filtros · N" (la búsqueda por ID y la vista no cuentan)
const CLAVES_FILTRO = ['desde', 'hasta', 'edificio', 'categoria', 'tiempo', 'tecnico']

const TEXTO_ORDEN = {
  activos: 'Ordenados por vencimiento: los más urgentes primero.',
  cerrados: 'Ordenados por fecha de cierre: los más recientes primero.',
  todos: 'Primero los activos, por vencimiento (los más urgentes primero); después los cerrados, los más recientes primero.',
}

const ESPERA_BUSQUEDA_MS = 300

// ---------- Filtros en la URL ----------

function useFiltrosUrl() {
  const [params, setParams] = useSearchParams()

  const vista = params.get('vista')
  const filtros = {
    vista: VISTAS.some((v) => v.valor === vista) ? vista : 'todos',
    q: params.get('q') ?? '',
    pagina: Math.max(1, Number.parseInt(params.get('pagina'), 10) || 1),
  }
  for (const clave of CLAVES_FILTRO) filtros[clave] = params.get(clave) ?? ''

  // Aplica cambios a la URL (null o '' borra el parámetro). Cualquier cambio que no
  // sea de página regresa a la página 1.
  const actualizar = useCallback(
    (cambios, { replace = false } = {}) => {
      setParams(
        (previos) => {
          const siguientes = new URLSearchParams(previos)
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor) siguientes.set(clave, valor)
            else siguientes.delete(clave)
          }
          if (!('pagina' in cambios)) siguientes.delete('pagina')
          return siguientes
        },
        { replace },
      )
    },
    [setParams],
  )

  return { filtros, actualizar, consulta: params.toString() }
}

// ---------- Celdas ----------

function TextoTecnico({ ticket }) {
  if (ticket.tecnico) return ticket.tecnico.nombre
  if (esActivo(ticket)) return <span className="text-texto-2">Sin asignar</span>
  return (
    <span className="text-texto-2">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Sin técnico</span>
    </span>
  )
}

function Tiempo({ ticket, ahora }) {
  if (ticket.estado === 'CANCELADO') return <Pill tipo="estado" valor="CANCELADO" />
  if (ticket.estado === 'CERRADO') {
    return <Pill tipo="neutro">Cerrado en {formatearDuracion(ticket.creadoEn, ticket.cerradoEn)}</Pill>
  }
  return <Pill tipo="semaforo" valor={calcularSemaforo(ticket, ahora)} />
}

// ---------- Filtros ----------

function CamposFiltro({ filtros, actualizar, catalogos, prefijo, claseCampo = '' }) {
  const cambiar = (clave) => (e) => actualizar({ [clave]: e.target.value })
  const soloCerrados = filtros.vista === 'cerrados'

  return (
    <>
      <Field
        id={`${prefijo}-desde`}
        label="Desde"
        type="date"
        value={filtros.desde}
        max={filtros.hasta || undefined}
        onChange={cambiar('desde')}
        className={claseCampo}
      />
      <Field
        id={`${prefijo}-hasta`}
        label="Hasta"
        type="date"
        value={filtros.hasta}
        min={filtros.desde || undefined}
        onChange={cambiar('hasta')}
        className={claseCampo}
      />
      <Select
        id={`${prefijo}-edificio`}
        label="Edificio"
        value={filtros.edificio}
        onChange={cambiar('edificio')}
        className={claseCampo}
      >
        <option value="">Todos</option>
        {catalogos?.edificios.map((edificio) => (
          <option key={edificio} value={edificio}>
            {edificio}
          </option>
        ))}
      </Select>
      <Select
        id={`${prefijo}-categoria`}
        label="Categoría"
        value={filtros.categoria}
        onChange={cambiar('categoria')}
        className={claseCampo}
      >
        <option value="">Todas</option>
        {catalogos?.categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </Select>
      <Select
        id={`${prefijo}-tiempo`}
        label="Tiempo"
        value={soloCerrados ? '' : filtros.tiempo}
        onChange={cambiar('tiempo')}
        disabled={soloCerrados}
        title={soloCerrados ? 'El semáforo solo aplica a tickets activos' : undefined}
        className={claseCampo}
      >
        <option value="">Todos</option>
        {Object.entries(ETIQUETA_SEMAFORO).map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </Select>
    </>
  )
}

// ---------- Lista ----------

function TablaTickets({ tickets, ahora }) {
  return (
    <table className="hidden w-full border-separate border-spacing-0 text-left lg:table">
      <caption className="sr-only">Tickets</caption>
      <thead>
        <tr>
          {['ID', 'Equipo', 'Ubicación', 'Categoría', 'Técnico', 'Estado', 'Tiempo'].map((titulo) => (
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
          // La fila es "relative" y el enlace del ID se estira sobre ella (after:inset-0):
          // toda la fila abre el detalle y con teclado se llega por el enlace.
          <tr key={t.id} className="relative hover:bg-crema focus-within:bg-crema [&:last-child>td]:border-b-0">
            <td className="border-b border-borde px-3 py-3">
              <Link
                to={`/admin/tickets/${t.id}`}
                className="font-bold underline underline-offset-2 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-negro"
              >
                #{t.id}
              </Link>
            </td>
            <td className="border-b border-borde px-3 py-3 font-semibold">{t.equipo.tipo}</td>
            <td className="border-b border-borde px-3 py-3">{formatearUbicacion(t.equipo.ubicacion)}</td>
            <td className="border-b border-borde px-3 py-3">{t.categoria.nombre}</td>
            <td className="border-b border-borde px-3 py-3">
              <TextoTecnico ticket={t} />
            </td>
            <td className="border-b border-borde px-3 py-3">{ETIQUETA_ESTADO[t.estado]}</td>
            <td className="border-b border-borde px-3 py-3">
              <Tiempo ticket={t} ahora={ahora} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TarjetasTickets({ tickets, ahora }) {
  return (
    <ul className="space-y-3 lg:hidden">
      {tickets.map((t) => (
        <li key={t.id}>
          <Link
            to={`/admin/tickets/${t.id}`}
            className="block rounded-xl border border-borde bg-tarjeta p-4 hover:border-borde-campo hover:bg-campo focus-visible:outline-2 focus-visible:outline-negro"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="font-bold">
                #{t.id} · {t.equipo.tipo}
              </span>
              <Tiempo ticket={t} ahora={ahora} />
            </span>
            <span className="mt-1 block text-texto-2">
              {formatearUbicacion(t.equipo.ubicacion)} · {t.categoria.nombre}
            </span>
            <span className="mt-1 block">
              {ETIQUETA_ESTADO[t.estado]} ·{' '}
              {t.tecnico ? (
                t.tecnico.nombre
              ) : esActivo(t) ? (
                <span className="font-semibold">Sin técnico</span>
              ) : (
                <span className="text-texto-2">Sin técnico</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Paginacion({ pagina, porPagina, total, onCambiar }) {
  const inicio = (pagina - 1) * porPagina + 1
  const fin = Math.min(pagina * porPagina, total)
  const ultima = Math.ceil(total / porPagina)

  return (
    <nav aria-label="Paginación" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p aria-live="polite" className="text-xs text-texto-2">
        Mostrando {inicio}–{fin} de {total}
      </p>
      {ultima > 1 && (
        <div className="flex gap-2">
          <Button variante="secundario" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
            Anterior
          </Button>
          <Button disabled={pagina >= ultima} onClick={() => onCambiar(pagina + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </nav>
  )
}

function ListaCargando() {
  return (
    <div role="status" className="lg:rounded-xl lg:border lg:border-borde lg:bg-tarjeta lg:p-5">
      <span className="sr-only">Cargando tickets…</span>
      <div className="hidden lg:block">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex gap-6 border-b border-borde px-3 py-4 last:border-b-0">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-3 lg:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2.5 rounded-xl border border-borde bg-tarjeta p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Página ----------

export default function Tickets() {
  const { filtros, actualizar, consulta } = useFiltrosUrl()

  const cargar = useCallback(() => getTickets(Object.fromEntries(new URLSearchParams(consulta))), [consulta])
  const { datos, cargando, error, recibidoEn: ahora, reintentar } = useDatos(cargar)
  const { datos: catalogos } = useDatos(getCatalogos)

  const [panelAbierto, setPanelAbierto] = useState(false)
  const refLista = useRef(null)

  // Búsqueda por ID: el texto se escribe libre y se manda a la URL 300 ms después.
  // Si la URL cambia por otra vía (Limpiar, atrás/adelante), el texto se sincroniza.
  const [texto, setTexto] = useState(filtros.q)
  const [qAnterior, setQAnterior] = useState(filtros.q)
  if (filtros.q !== qAnterior) {
    setQAnterior(filtros.q)
    setTexto(filtros.q)
  }
  useEffect(() => {
    const limpio = texto.trim()
    if (limpio === filtros.q) return
    const espera = setTimeout(() => actualizar({ q: limpio }, { replace: true }), ESPERA_BUSQUEDA_MS)
    return () => clearTimeout(espera)
  }, [texto, filtros.q, actualizar])

  const numFiltros = CLAVES_FILTRO.filter((clave) => filtros[clave]).length
  const hayFiltros = numFiltros > 0 || filtros.q !== ''

  const limpiar = () => actualizar(Object.fromEntries([...CLAVES_FILTRO, 'q'].map((clave) => [clave, null])))

  const cambiarVista = (vista) =>
    actualizar({
      vista: vista === 'todos' ? null : vista,
      // El semáforo solo existe en activos: en Cerrados no tiene sentido filtrar por tiempo
      ...(vista === 'cerrados' ? { tiempo: null } : {}),
    })

  const cambiarPagina = (pagina) => {
    actualizar({ pagina: pagina > 1 ? String(pagina) : null })
    refLista.current?.scrollIntoView({ block: 'start' })
  }

  const nombreTecnico =
    filtros.tecnico === 'sin'
      ? 'Sin asignar'
      : (datos?.datos.find((t) => t.tecnico?.id === filtros.tecnico)?.tecnico.nombre ?? 'seleccionado')

  return (
    <div className="space-y-4">
      {/* Pestañas */}
      <div role="group" aria-label="Vista" className="grid grid-cols-3 gap-2 sm:flex">
        {VISTAS.map(({ valor, texto: etiqueta }) => {
          const activa = filtros.vista === valor
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={activa}
              onClick={() => cambiarVista(valor)}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro ${
                activa ? 'border-negro bg-negro text-crema' : 'border-borde-campo bg-tarjeta hover:bg-campo'
              }`}
            >
              {etiqueta}
              {datos?.conteos && ` · ${datos.conteos[valor]}`}
            </button>
          )
        })}
      </div>

      {/* Filtros: tarjeta completa en escritorio; buscador + botón "Filtros" en celular */}
      <section aria-label="Filtros" className="md:rounded-xl md:border md:border-borde md:bg-tarjeta md:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 md:w-48 md:flex-none">
            <label
              htmlFor="buscar-id"
              className="sr-only md:not-sr-only md:mb-1.5 md:block md:text-xs md:font-semibold md:text-texto-2"
            >
              Buscar por ID
            </label>
            <div className="relative">
              <IconoBuscar className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-texto-2" />
              <input
                id="buscar-id"
                type="search"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Buscar por ID"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="block min-h-12 w-full rounded-lg border border-borde-campo bg-campo pr-3 pl-10 text-base text-negro placeholder:text-texto-2/80 focus:outline-2 focus:outline-offset-1 focus:outline-negro"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPanelAbierto(true)}
            aria-haspopup="dialog"
            aria-expanded={panelAbierto}
            className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-negro bg-tarjeta px-4 font-semibold hover:bg-negro/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro md:hidden"
          >
            <IconoFiltros className="size-[18px]" />
            Filtros{numFiltros > 0 && ` · ${numFiltros}`}
          </button>

          <div className="hidden md:contents">
            <CamposFiltro
              filtros={filtros}
              actualizar={actualizar}
              catalogos={catalogos}
              prefijo="filtro"
              claseCampo="w-40"
            />
            <Button variante="secundario" onClick={limpiar} disabled={!hayFiltros} className="min-h-12">
              Limpiar
            </Button>
          </div>
        </div>

        {(filtros.tecnico || filtros.desde || filtros.hasta) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {filtros.tecnico && (
              <button
                type="button"
                onClick={() => actualizar({ tecnico: null })}
                aria-label={`Quitar filtro: técnico ${nombreTecnico}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-negro bg-tarjeta px-3 text-xs font-semibold hover:bg-negro/5 focus-visible:outline-2 focus-visible:outline-negro"
              >
                Técnico: {nombreTecnico}
                <IconoCerrar className="size-4" />
              </button>
            )}
            {(filtros.desde || filtros.hasta) && (
              <p className="text-xs text-texto-2">
                Fechas: los activos se filtran por fecha de reporte; los cerrados y cancelados, por fecha de cierre.
              </p>
            )}
          </div>
        )}
      </section>

      <Modal
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        titulo="Filtros"
        posicion="abajo"
        pie={
          <>
            <Button variante="secundario" onClick={limpiar} disabled={!hayFiltros} className="flex-1">
              Limpiar
            </Button>
            <Button onClick={() => setPanelAbierto(false)} className="flex-1">
              Ver resultados
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <CamposFiltro filtros={filtros} actualizar={actualizar} catalogos={catalogos} prefijo="panel" />
        </div>
      </Modal>

      <p className="text-xs text-texto-2">
        {TEXTO_ORDEN[filtros.vista]} <span className="hidden lg:inline">Toda la fila abre el detalle del ticket.</span>
        <span className="lg:hidden">Toca un ticket para ver su detalle.</span>
      </p>

      {/* Lista */}
      <section ref={refLista} aria-labelledby="titulo-lista" className="scroll-mt-4">
        <h2 id="titulo-lista" className="sr-only">
          Lista de tickets
        </h2>

        {cargando ? (
          <ListaCargando />
        ) : error ? (
          <Card className="mx-auto max-w-md text-center">
            <div role="alert">
              <p className="text-base font-semibold">No se pudieron cargar los tickets</p>
              <p className="mt-1 text-texto-2">{error.message}</p>
            </div>
            <Button variante="secundario" className="mt-4" onClick={reintentar}>
              Reintentar
            </Button>
          </Card>
        ) : datos.total === 0 ? (
          <Card>
            <EmptyState
              icono={<IconoBuscar className="size-6" />}
              titulo={hayFiltros ? 'No hay tickets con estos filtros' : 'No hay tickets en esta vista'}
              mensaje={hayFiltros ? 'Prueba con otros filtros o quítalos para ver todos.' : undefined}
              accion={
                hayFiltros && (
                  <Button variante="secundario" onClick={limpiar}>
                    Limpiar filtros
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          <div className="lg:rounded-xl lg:border lg:border-borde lg:bg-tarjeta lg:p-5">
            <TablaTickets tickets={datos.datos} ahora={ahora} />
            <TarjetasTickets tickets={datos.datos} ahora={ahora} />
            <Paginacion
              pagina={datos.pagina}
              porPagina={datos.porPagina}
              total={datos.total}
              onCambiar={cambiarPagina}
            />
          </div>
        )}
      </section>
    </div>
  )
}
