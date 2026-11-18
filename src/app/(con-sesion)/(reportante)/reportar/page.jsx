'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { crearReporte, getCatalogos, getTicketActivo, sumarmeAReporte } from '@/api/tickets.js'
import { IconoAdvertencia, IconoTipoEquipo } from '@/components/layout/iconos.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import AreaTexto from '@/components/ui/AreaTexto.jsx'
import Button from '@/components/ui/Button.jsx'
import CampoFoto from '@/components/ui/CampoFoto.jsx'
import Card from '@/components/ui/Card.jsx'
import Pill from '@/components/ui/Pill.jsx'
import Select from '@/components/ui/Select.jsx'
import Skeleton from '@/components/ui/Skeleton.jsx'
import { useToast } from '@/components/ui/useToast.js'
import { useAuth } from '@/context/useAuth.js'
import { useDatos } from '@/hooks/useDatos.js'
import { formatearFecha } from '@/utils/fechas.js'
import { enfocarPrimerError } from '@/utils/formulario.js'

const MIN_DESCRIPCION = 15
const MAX_DESCRIPCION = 1000
const ORDEN = ['edificio', 'aula', 'equipo', 'categoria', 'descripcion', 'foto']
const VACIO = { edificio: '', aula: '', equipoId: '', categoriaId: '', descripcion: '' }

const SIN_ACTIVO = () => Promise.resolve({ ticket: null })

const porAula = (a, b) => a.localeCompare(b, 'es', { numeric: true })

function validar(valores) {
  const errores = {}
  if (!valores.edificio) errores.edificio = 'Elige el edificio.'
  if (!valores.aula) errores.aula = 'Elige el aula o espacio.'
  if (!valores.equipoId) errores.equipo = 'Elige el equipo que falla.'
  if (!valores.categoriaId) errores.categoria = 'Elige el tipo de falla.'
  const largo = valores.descripcion.trim().length
  if (largo === 0) errores.descripcion = 'Describe qué le pasa al equipo.'
  else if (largo < MIN_DESCRIPCION) {
    errores.descripcion = `Escribe un poco más (mínimo ${MIN_DESCRIPCION} caracteres) para que el técnico sepa qué revisar.`
  }
  return errores
}

// ---------- Piezas ----------

function Paso({ numero, titulo, children }) {
  return (
    <Card as="fieldset" className="min-w-0">
      <legend className="sr-only">
        Paso {numero}: {titulo}
      </legend>
      <p aria-hidden="true" className="mb-4 flex items-center gap-3 text-base font-semibold">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-negro text-sm text-crema">
          {numero}
        </span>
        {titulo}
      </p>
      <div className="space-y-4">{children}</div>
    </Card>
  )
}

function ElegirEquipo({ equipos, valor, onChange, error }) {
  const idError = 'equipo-error'
  return (
    <fieldset aria-invalid={error ? true : undefined} aria-describedby={error ? idError : undefined}>
      <legend className="mb-1.5 block text-xs font-semibold text-texto-2">Equipo</legend>
      <ul className="space-y-2">
        {equipos.map((e) => {
          const elegido = valor === e.id
          return (
            <li key={e.id}>
              <label
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg px-3.5 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-negro ${
                  elegido
                    ? 'border-2 border-negro bg-crema'
                    : `bg-campo hover:bg-tarjeta ${error ? 'border-2 border-peligro' : 'border border-borde-campo'}`
                }`}
              >
                <input
                  type="radio"
                  name="equipo"
                  value={e.id}
                  checked={elegido}
                  onChange={() => onChange(e.id)}
                  className="size-5 shrink-0 accent-negro"
                />
                <IconoTipoEquipo tipo={e.tipo} className="size-6 text-texto-2" />
                <span className="min-w-0">
                  <span className="block font-semibold">{e.tipo}</span>
                  <span className="block text-xs text-texto-2">{e.descripcion}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {error && (
        <p id={idError} className="mt-1.5 text-xs font-semibold text-peligro">
          {error}
        </p>
      )}
    </fieldset>
  )
}

const textoPersonas = (n) => (n === 1 ? '1 persona lo reportó' : `${n} personas lo reportaron`)

// Aviso cuando el equipo ya tiene un reporte activo: sumarse en vez de duplicarlo
function AvisoDuplicado({ ticket, relacion, ahora, sumando, onSumarme, onDistinta }) {
  const personas = 1 + (ticket.sumados?.length ?? 0)

  return (
    <section
      aria-labelledby="aviso-duplicado"
      className="rounded-xl border border-aviso-punto/50 bg-aviso-fondo p-4 text-aviso-texto"
    >
      <h2 id="aviso-duplicado" className="flex items-start gap-2 font-semibold">
        <IconoAdvertencia className="mt-0.5 size-5" />
        {relacion ? `Ya estás en el reporte #${ticket.id} de este equipo` : `Este equipo ya tiene un reporte activo: #${ticket.id}`}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-negro">
        <Pill tipo="estado" valor={ticket.estado} />
        <span className="text-xs text-aviso-texto">
          Reportado {formatearFecha(ticket.creadoEn, ahora)} · {textoPersonas(personas)}
        </span>
      </div>
      <p className="mt-2 text-negro">“{ticket.descripcion}”</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {relacion ? (
          <Link
            href={`/mis-reportes/${ticket.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-negro bg-negro px-4 text-base font-semibold text-crema hover:bg-negro/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro"
          >
            Ver el reporte #{ticket.id}
          </Link>
        ) : (
          <Button onClick={onSumarme} cargando={sumando} textoCargando="Sumándote…">
            Sumarme a este reporte
          </Button>
        )}
        <Button variante="secundario" onClick={onDistinta} disabled={sumando}>
          Es una falla distinta
        </Button>
      </div>
      {!relacion && (
        <p className="mt-3 text-xs">
          Al sumarte, mantenimiento sabe que más personas tienen el problema y te avisamos del avance en Mis reportes.
        </p>
      )}
    </section>
  )
}

function FormularioCargando() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Cargando formulario…</span>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-borde bg-tarjeta p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  )
}

// ---------- Página ----------

export default function Reportar() {
  const router = useRouter()
  const toast = useToast()
  const { usuario } = useAuth()

  const { datos: catalogos, cargando, error: errorCatalogos, reintentar } = useDatos(getCatalogos)

  const [valores, setValores] = useState(VACIO)
  const [foto, setFoto] = useState(null)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [sumando, setSumando] = useState(false)
  // El equipo para el que se eligió "Es una falla distinta" (se reinicia al cambiar de equipo)
  const [distintaPara, setDistintaPara] = useState(null)

  // ¿El equipo elegido ya tiene un reporte activo?
  const cargarActivo = useCallback(
    () => (valores.equipoId ? getTicketActivo(valores.equipoId) : SIN_ACTIVO()),
    [valores.equipoId],
  )
  const { datos: activo, cargando: revisando, recibidoEn: ahora, reemplazar: reemplazarActivo } = useDatos(cargarActivo)
  const ticketActivo = valores.equipoId && !revisando ? activo?.ticket : null
  const relacion = ticketActivo
    ? ticketActivo.reporta.id === usuario?.id
      ? 'PROPIO'
      : ticketActivo.sumados?.some((p) => p.id === usuario?.id)
        ? 'SUMADO'
        : null
    : null
  const esDistinta = Boolean(ticketActivo) && distintaPara === valores.equipoId
  // El paso 3 se muestra cuando ya hay equipo y no hay un reporte activo pendiente de decidir
  const mostrarDetalle = Boolean(valores.equipoId) && !revisando && (!ticketActivo || esDistinta)

  const equipos = useMemo(() => catalogos?.equipos ?? [], [catalogos])
  const edificios = useMemo(() => [...new Set(equipos.map((e) => e.ubicacion.edificio))].sort(porAula), [equipos])
  const aulas = useMemo(
    () =>
      [...new Set(equipos.filter((e) => e.ubicacion.edificio === valores.edificio).map((e) => e.ubicacion.aula))].sort(
        porAula,
      ),
    [equipos, valores.edificio],
  )
  const equiposDelAula = equipos.filter(
    (e) => e.ubicacion.edificio === valores.edificio && e.ubicacion.aula === valores.aula,
  )

  function cambiar(cambios, campoError) {
    setValores((previos) => ({ ...previos, ...cambios }))
    if (campoError && errores[campoError]) setErrores((previos) => ({ ...previos, [campoError]: undefined }))
    setErrorGeneral('')
  }

  const elegirEdificio = (edificio) => cambiar({ edificio, aula: '', equipoId: '' }, 'edificio')
  const elegirAula = (aula) => cambiar({ aula, equipoId: '' }, 'aula')
  const elegirEquipo = (equipoId) => cambiar({ equipoId }, 'equipo')

  function cambiarFoto(valor, error) {
    setFoto(valor)
    setErrores((previos) => ({ ...previos, foto: error }))
  }

  function marcarDistinta() {
    setDistintaPara(valores.equipoId)
    // El foco pasa al primer campo del paso 3, que acaba de aparecer
    requestAnimationFrame(() => document.getElementById('categoria')?.focus())
  }

  async function sumarme() {
    setSumando(true)
    try {
      const ticket = await sumarmeAReporte(ticketActivo.id)
      toast.exito(`Te sumaste al reporte #${ticket.id}`)
      router.push(`/reportes/${ticket.id}/enviado`)
    } catch (error) {
      toast.error(error.message || 'No se pudo sumar al reporte. Inténtalo de nuevo.')
      setSumando(false)
    }
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevosErrores = validar(valores)
    if (errores.foto) nuevosErrores.foto = errores.foto
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) {
      enfocarPrimerError(nuevosErrores, ORDEN)
      return
    }

    setEnviando(true)
    try {
      const ticket = await crearReporte({
        equipoId: valores.equipoId,
        categoriaId: valores.categoriaId,
        descripcion: valores.descripcion.trim(),
        foto: foto?.archivo,
        esFallaDistinta: esDistinta,
      })
      toast.exito(`Reporte #${ticket.id} enviado`)
      router.push(`/reportes/${ticket.id}/enviado`)
    } catch (error) {
      setEnviando(false)
      if (error.status === 409 && error.datos?.ticketId) {
        // Alguien más lo reportó mientras se llenaba el formulario: se muestra el aviso
        const { ticket } = await getTicketActivo(valores.equipoId).catch(() => ({ ticket: null }))
        if (ticket) {
          reemplazarActivo({ ticket })
          setDistintaPara(null)
        }
        setErrorGeneral(error.message)
        return
      }
      setErrorGeneral(error.message || 'No se pudo enviar el reporte. Inténtalo de nuevo.')
    }
  }

  let contenido
  if (cargando) {
    contenido = <FormularioCargando />
  } else if (errorCatalogos) {
    contenido = (
      <Card className="text-center">
        <div role="alert">
          <p className="text-base font-semibold">No se pudo cargar el formulario</p>
          <p className="mt-1 text-texto-2">{errorCatalogos.message}</p>
        </div>
        <Button variante="secundario" className="mt-4" onClick={reintentar}>
          Reintentar
        </Button>
      </Card>
    )
  } else {
    contenido = (
      <form noValidate onSubmit={enviar} className="space-y-4">
        {errorGeneral && (
          <div role="alert" className="rounded-lg bg-error-fondo px-3.5 py-3 text-[13px] font-semibold text-error-texto">
            {errorGeneral}
          </div>
        )}

        <Paso numero={1} titulo="¿Dónde está?">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="edificio"
              label="Edificio"
              value={valores.edificio}
              onChange={(e) => elegirEdificio(e.target.value)}
              error={errores.edificio}
            >
              <option value="">Elige el edificio</option>
              {edificios.map((edificio) => (
                <option key={edificio} value={edificio}>
                  {edificio}
                </option>
              ))}
            </Select>
            <Select
              id="aula"
              label="Aula o espacio"
              value={valores.aula}
              onChange={(e) => elegirAula(e.target.value)}
              disabled={!valores.edificio}
              error={errores.aula}
            >
              <option value="">{valores.edificio ? 'Elige el aula' : 'Primero elige el edificio'}</option>
              {aulas.map((aula) => (
                <option key={aula} value={aula}>
                  {aula}
                </option>
              ))}
            </Select>
          </div>
        </Paso>

        {valores.aula && (
          <Paso numero={2} titulo="¿Qué equipo falla?">
            <ElegirEquipo
              equipos={equiposDelAula}
              valor={valores.equipoId}
              onChange={elegirEquipo}
              error={errores.equipo}
            />
            <p className="text-xs text-texto-2">
              ¿No está en la lista? Avisa a mantenimiento para que lo den de alta.
            </p>

            <div aria-live="polite">
              {valores.equipoId && revisando && (
                <div className="flex items-center gap-2 text-texto-2">
                  <Skeleton className="size-4 rounded-full" />
                  Revisando si ya hay un reporte de este equipo…
                </div>
              )}
              {ticketActivo && !esDistinta && (
                <AvisoDuplicado
                  ticket={ticketActivo}
                  relacion={relacion}
                  ahora={ahora}
                  sumando={sumando}
                  onSumarme={sumarme}
                  onDistinta={marcarDistinta}
                />
              )}
              {ticketActivo && esDistinta && (
                <p className="rounded-lg bg-crema px-3 py-2 text-texto-2">
                  Vas a crear un reporte nuevo para este equipo, aparte del #{ticketActivo.id}.{' '}
                  <button
                    type="button"
                    onClick={() => setDistintaPara(null)}
                    className="font-semibold text-negro underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro"
                  >
                    Mejor sumarme al #{ticketActivo.id}
                  </button>
                </p>
              )}
            </div>
          </Paso>
        )}

        {mostrarDetalle && (
          <Paso numero={3} titulo="¿Qué le pasa?">
            <Select
              id="categoria"
              label="Tipo de falla"
              value={valores.categoriaId}
              onChange={(e) => cambiar({ categoriaId: e.target.value }, 'categoria')}
              error={errores.categoria}
            >
              <option value="">Elige el tipo de falla</option>
              {catalogos.categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Select>

            <AreaTexto
              id="descripcion"
              label="Descripción"
              placeholder="Ej.: El proyector enciende pero no muestra imagen; la luz parpadea en naranja."
              value={valores.descripcion}
              onChange={(e) => cambiar({ descripcion: e.target.value }, 'descripcion')}
              minimo={MIN_DESCRIPCION}
              maximo={MAX_DESCRIPCION}
              error={errores.descripcion}
            />

            <CampoFoto id="foto" label="Foto de la falla" valor={foto} onChange={cambiarFoto} error={errores.foto} />
          </Paso>
        )}

        {mostrarDetalle && (
          <Button type="submit" cargando={enviando} textoCargando="Enviando…" className="w-full sm:w-auto">
            Enviar reporte
          </Button>
        )}
      </form>
    )
  }

  return (
    <>
      <PageHeader titulo="Reportar falla" />
      <div className="max-w-2xl space-y-4">
        <p className="text-texto-2">
          Dinos dónde está el equipo y qué le pasa. Mantenimiento lo revisa y te avisamos del avance.
        </p>
        {contenido}
      </div>
    </>
  )
}
