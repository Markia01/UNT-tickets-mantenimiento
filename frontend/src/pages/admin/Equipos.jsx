import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { getConfiguracion, getEquipos } from '../../api/equipos.js'
import { getCatalogos } from '../../api/tickets.js'
import { IconoBuscar, IconoEquipos, IconoMas } from '../../components/layout/iconos.jsx'
import Button from '../../components/ui/Button.jsx'
import CampoBusqueda from '../../components/ui/CampoBusqueda.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Pill from '../../components/ui/Pill.jsx'
import Select from '../../components/ui/Select.jsx'
import Skeleton from '../../components/ui/Skeleton.jsx'
import { useToast } from '../../components/ui/useToast.js'
import { useDatos } from '../../hooks/useDatos.js'
import { useFiltrosUrl } from '../../hooks/useFiltrosUrl.js'
import { useTextoDiferido } from '../../hooks/useTextoDiferido.js'
import { formatearDia } from '../../utils/fechas.js'
import { formatearUbicacion } from '../../utils/ticket.js'
import ModalEquipo from './equipos/ModalEquipo.jsx'

const ESTADOS = [
  { valor: '', texto: 'Activos' }, // por defecto (ACTIVO)
  { valor: 'BAJA', texto: 'Dados de baja' },
  { valor: 'TODOS', texto: 'Todos' },
]

const NOTA =
  'Ordenados por número de fallas: los primeros son candidatos a reemplazo. Al dar de baja un equipo, su historial se conserva pero ya no aparece entre los activos.'

const textoFallas = (n) => `${n} ${n === 1 ? 'falla' : 'fallas'}`

// Número de fallas; en etiqueta roja si alcanza la regla de reemplazo
function Fallas({ equipo, regla, conTexto = false }) {
  const reemplazo = regla && equipo.fallas >= regla.fallas
  const sr = `${equipo.fallas === 1 ? ' falla' : ' fallas'}${reemplazo ? ', alcanza la regla de reemplazo' : ''}`

  if (reemplazo) {
    return (
      <span className="inline-flex rounded-full bg-error-fondo px-2.5 py-0.5 text-xs font-bold text-error-texto">
        {conTexto ? textoFallas(equipo.fallas) : equipo.fallas}
        {!conTexto && <span className="sr-only">{sr}</span>}
        {conTexto && <span className="sr-only">, alcanza la regla de reemplazo</span>}
      </span>
    )
  }
  if (conTexto) return <Pill tipo="neutro">{textoFallas(equipo.fallas)}</Pill>
  return (
    <span className={equipo.fallas === 0 ? 'text-texto-2' : ''}>
      {equipo.fallas}
      <span className="sr-only">{sr}</span>
    </span>
  )
}

function UltimaFalla({ fecha }) {
  return fecha ? formatearDia(fecha) : <span className="text-texto-2">Sin fallas</span>
}

function TablaEquipos({ equipos, regla, estadoEnlace }) {
  const columnaFallas = regla ? `Fallas (${regla.dias} días)` : 'Fallas'
  return (
    <table className="hidden w-full border-separate border-spacing-0 text-left lg:table">
      <caption className="sr-only">Equipos</caption>
      <thead>
        <tr>
          {['Tipo', 'Descripción', 'Ubicación', columnaFallas, 'Última falla'].map((titulo) => (
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
        {equipos.map((e) => (
          <tr key={e.id} className="hover:bg-crema [&:last-child>td]:border-b-0">
            <td className="border-b border-borde px-3 py-3">
              <span className="font-semibold">{e.tipo}</span>
              {e.estado === 'BAJA' && <Pill tipo="equipo" valor="BAJA" className="ml-2" />}
            </td>
            <td className="border-b border-borde px-3 py-3 text-texto-2">{e.descripcion}</td>
            <td className="border-b border-borde px-3 py-3">{formatearUbicacion(e.ubicacion)}</td>
            <td className="border-b border-borde px-3 py-3">
              <Fallas equipo={e} regla={regla} />
            </td>
            <td className="border-b border-borde px-3 py-3">
              <UltimaFalla fecha={e.ultimaFalla} />
            </td>
            <td className="border-b border-borde px-3 py-3 text-right">
              <Link
                to={`/admin/equipos/${e.id}`}
                state={estadoEnlace}
                className="inline-flex min-h-11 items-center font-semibold whitespace-nowrap underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro"
              >
                Ver historial
                <span className="sr-only">
                  {' '}
                  de {e.tipo}, {formatearUbicacion(e.ubicacion)}
                </span>
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TarjetasEquipos({ equipos, regla, estadoEnlace }) {
  return (
    <ul className="space-y-3 lg:hidden">
      {equipos.map((e) => (
        <li key={e.id}>
          <Link
            to={`/admin/equipos/${e.id}`}
            state={estadoEnlace}
            className="block rounded-xl border border-borde bg-tarjeta p-4 hover:border-borde-campo hover:bg-campo focus-visible:outline-2 focus-visible:outline-negro"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="font-bold">{e.tipo}</span>
              <Fallas equipo={e} regla={regla} conTexto />
            </span>
            <span className="mt-1 block text-texto-2">
              {formatearUbicacion(e.ubicacion)} · {e.descripcion}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-2">
              <span>
                Última falla: <UltimaFalla fecha={e.ultimaFalla} />
              </span>
              {e.estado === 'BAJA' && <Pill tipo="equipo" valor="BAJA" />}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ListaCargando() {
  return (
    <div role="status" className="lg:rounded-xl lg:border lg:border-borde lg:bg-tarjeta lg:p-5">
      <span className="sr-only">Cargando equipos…</span>
      <div className="hidden lg:block">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex gap-6 border-b border-borde px-3 py-4 last:border-b-0">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-3 lg:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2.5 rounded-xl border border-borde bg-tarjeta p-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Equipos() {
  const toast = useToast()
  const { params, actualizar, consulta } = useFiltrosUrl()
  const filtros = {
    q: params.get('q') ?? '',
    edificio: params.get('edificio') ?? '',
    tipo: params.get('tipo') ?? '',
    estado: ESTADOS.some((e) => e.valor === params.get('estado')) ? params.get('estado') : '',
  }

  const cargar = useCallback(() => getEquipos(Object.fromEntries(new URLSearchParams(consulta))), [consulta])
  const { datos: equipos, cargando, error, reintentar } = useDatos(cargar)
  const { datos: catalogos } = useDatos(getCatalogos)
  const { datos: configuracion } = useDatos(getConfiguracion)
  const regla = configuracion?.reemplazo

  const confirmarBusqueda = useCallback((q) => actualizar({ q }, { replace: true }), [actualizar])
  const [texto, setTexto] = useTextoDiferido(filtros.q, confirmarBusqueda)

  const [modalAbierto, setModalAbierto] = useState(false)

  const hayFiltros = Boolean(filtros.q || filtros.edificio || filtros.tipo || filtros.estado)
  const limpiar = () => actualizar({ q: null, edificio: null, tipo: null, estado: null })
  const estadoEnlace = { lista: consulta ? `?${consulta}` : '' }

  function alGuardar() {
    setModalAbierto(false)
    toast.exito('Equipo agregado')
    reintentar()
  }

  return (
    <div className="space-y-4">
      <section aria-label="Filtros" className="rounded-xl border border-borde bg-tarjeta p-5">
        <div className="grid gap-3 sm:grid-cols-3 lg:flex lg:items-end">
          <CampoBusqueda
            id="buscar-equipo"
            label="Buscar equipo"
            placeholder="Tipo o descripción"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="sm:col-span-3 lg:min-w-48 lg:flex-1"
          />
          <Select
            id="filtro-edificio"
            label="Edificio"
            value={filtros.edificio}
            onChange={(e) => actualizar({ edificio: e.target.value })}
            className="lg:w-40"
          >
            <option value="">Todos</option>
            {catalogos?.edificios.map((edificio) => (
              <option key={edificio} value={edificio}>
                {edificio}
              </option>
            ))}
          </Select>
          <Select
            id="filtro-tipo"
            label="Tipo"
            value={filtros.tipo}
            onChange={(e) => actualizar({ tipo: e.target.value })}
            className="lg:w-44"
          >
            <option value="">Todos</option>
            {catalogos?.tiposEquipo.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </Select>
          <Select
            id="filtro-estado"
            label="Estado"
            value={filtros.estado}
            onChange={(e) => actualizar({ estado: e.target.value })}
            className="lg:w-40"
          >
            {ESTADOS.map((estado) => (
              <option key={estado.valor} value={estado.valor}>
                {estado.texto}
              </option>
            ))}
          </Select>
          <Button onClick={() => setModalAbierto(true)} className="min-h-12 gap-2 sm:col-span-3 lg:w-auto">
            <IconoMas className="size-[18px]" />
            Agregar equipo
          </Button>
        </div>
      </section>

      <section aria-labelledby="titulo-equipos">
        <h2 id="titulo-equipos" className="sr-only">
          Lista de equipos
        </h2>

        {cargando ? (
          <ListaCargando />
        ) : error ? (
          <Card className="mx-auto max-w-md text-center">
            <div role="alert">
              <p className="text-base font-semibold">No se pudieron cargar los equipos</p>
              <p className="mt-1 text-texto-2">{error.message}</p>
            </div>
            <Button variante="secundario" className="mt-4" onClick={reintentar}>
              Reintentar
            </Button>
          </Card>
        ) : equipos.length === 0 ? (
          <Card>
            {hayFiltros ? (
              <EmptyState
                icono={<IconoBuscar className="size-6" />}
                titulo="No hay equipos con estos filtros"
                mensaje="Prueba con otros filtros o quítalos para ver todos."
                accion={
                  <Button variante="secundario" onClick={limpiar}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icono={<IconoEquipos className="size-6" />}
                titulo="Todavía no hay equipos"
                mensaje="Agrega los equipos de cada aula para poder reportar sus fallas."
              />
            )}
          </Card>
        ) : (
          <div className="lg:rounded-xl lg:border lg:border-borde lg:bg-tarjeta lg:p-5">
            <TablaEquipos equipos={equipos} regla={regla} estadoEnlace={estadoEnlace} />
            <TarjetasEquipos equipos={equipos} regla={regla} estadoEnlace={estadoEnlace} />
            <p className="mt-4 text-xs leading-relaxed text-texto-2">{NOTA}</p>
          </div>
        )}
      </section>

      <ModalEquipo
        abierto={modalAbierto}
        catalogos={catalogos}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={alGuardar}
      />
    </div>
  )
}
