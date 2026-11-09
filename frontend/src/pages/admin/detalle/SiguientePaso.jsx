import { useState } from 'react'
import { asignarTecnico, cancelarTicket, getTecnicos } from '../../../api/tickets.js'
import { IconoPalomita } from '../../../components/layout/iconos.jsx'
import Button from '../../../components/ui/Button.jsx'
import Card from '../../../components/ui/Card.jsx'
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx'
import Select from '../../../components/ui/Select.jsx'
import { useToast } from '../../../components/ui/useToast.js'
import { useDatos } from '../../../hooks/useDatos.js'
import { MOTIVOS_CANCELACION } from '../../../utils/ticket.js'

const PASOS = [
  { titulo: 'Asignar técnico', quien: 'administrador' },
  { titulo: 'Marcar en proceso', quien: 'técnico' },
  { titulo: 'Cerrar con foto', quien: 'técnico' },
]

const PASO_ACTUAL = { ABIERTO: 1, ASIGNADO: 2, EN_PROCESO: 3 }

const textoCarga = (n) => `${n} ${n === 1 ? 'ticket activo' : 'tickets activos'}`
const minusculaInicial = (texto) => texto.charAt(0).toLowerCase() + texto.slice(1)

function Pasos({ actual }) {
  return (
    <ol className="space-y-1.5">
      {PASOS.map((paso, i) => {
        const numero = i + 1
        const hecho = numero < actual
        const esActual = numero === actual
        return (
          <li
            key={paso.titulo}
            aria-current={esActual ? 'step' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${esActual ? 'border border-negro bg-crema' : 'border border-transparent'}`}
          >
            <span
              aria-hidden="true"
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                hecho || esActual ? 'bg-negro text-crema' : 'border border-borde-campo text-texto-2'
              }`}
            >
              {hecho ? <IconoPalomita className="size-4" /> : numero}
            </span>
            <span className={hecho || esActual ? '' : 'text-texto-2'}>
              <span className={esActual ? 'font-bold' : 'font-semibold'}>{paso.titulo}</span>
              <span className="text-texto-2"> · {paso.quien}</span>
              {hecho && <span className="sr-only"> (hecho)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

// Tarjeta de acciones de un ticket activo: asignar o reasignar técnico y cancelar.
// `onActualizado(ticket)` recibe el ticket que devolvió la API.
export default function SiguientePaso({ ticket, onActualizado }) {
  const toast = useToast()
  const tecnicos = useDatos(getTecnicos)

  const [tecnicoId, setTecnicoId] = useState('')
  const [errorTecnico, setErrorTecnico] = useState(null)
  const [asignando, setAsignando] = useState(false)

  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)

  const reasignar = ticket.estado !== 'ABIERTO'
  const opciones = (tecnicos.datos ?? []).filter((t) => t.id !== ticket.tecnico?.id)

  async function asignar(e) {
    e.preventDefault()
    if (!tecnicoId) {
      setErrorTecnico('Elige un técnico')
      return
    }
    setAsignando(true)
    try {
      const actualizado = await asignarTecnico(ticket.id, tecnicoId)
      setTecnicoId('')
      onActualizado(actualizado)
      tecnicos.reintentar() // la carga de cada técnico cambió
      toast.exito(`Técnico asignado al ticket #${ticket.id}`)
    } catch (error) {
      toast.error(error.message || 'No se pudo asignar el técnico. Inténtalo de nuevo.')
    } finally {
      setAsignando(false)
    }
  }

  function pedirConfirmacion() {
    if (!motivo) {
      setErrorMotivo('Elige un motivo')
      return
    }
    setConfirmando(true)
  }

  async function cancelar() {
    setCancelando(true)
    try {
      const actualizado = await cancelarTicket(ticket.id, motivo)
      setConfirmando(false)
      onActualizado(actualizado)
      toast.exito(`Ticket #${ticket.id} cancelado`)
    } catch (error) {
      setConfirmando(false)
      toast.error(error.message || 'No se pudo cancelar el ticket. Inténtalo de nuevo.')
    } finally {
      setCancelando(false)
    }
  }

  const selectTecnico = (
    <Select
      id="tecnico"
      label={reasignar ? 'Reasignar a' : 'Técnico'}
      value={tecnicoId}
      onChange={(e) => {
        setTecnicoId(e.target.value)
        setErrorTecnico(null)
      }}
      disabled={tecnicos.cargando || asignando}
      error={errorTecnico}
    >
      <option value="">{tecnicos.cargando ? 'Cargando técnicos…' : 'Seleccionar…'}</option>
      {opciones.map((t) => (
        <option key={t.id} value={t.id}>
          {t.nombre} · {textoCarga(t.activos)}
        </option>
      ))}
    </Select>
  )

  return (
    <Card titulo="Siguiente paso">
      <Pasos actual={PASO_ACTUAL[ticket.estado]} />

      <form onSubmit={asignar} noValidate className="mt-5 space-y-3">
        {reasignar && (
          <div>
            <p className="text-xs text-texto-2">Técnico asignado</p>
            <p className="font-semibold">{ticket.tecnico?.nombre ?? 'Sin asignar'}</p>
          </div>
        )}

        {selectTecnico}

        {tecnicos.error && (
          <p className="text-xs text-peligro">
            No se pudieron cargar los técnicos.{' '}
            <button type="button" onClick={tecnicos.reintentar} className="font-semibold underline">
              Reintentar
            </button>
          </p>
        )}
        {!tecnicos.cargando && !tecnicos.error && opciones.length === 0 && (
          <p className="text-xs text-texto-2">No hay {reasignar ? 'otros ' : ''}técnicos activos.</p>
        )}

        <Button
          type="submit"
          variante={reasignar ? 'secundario' : 'principal'}
          cargando={asignando}
          disabled={tecnicos.cargando}
          className="w-full"
        >
          {reasignar ? 'Reasignar' : 'Asignar técnico'}
        </Button>

        <p className="text-xs leading-relaxed text-texto-2">
          {ticket.estado === 'EN_PROCESO'
            ? 'Si lo reasignas, vuelve a Asignado y el nuevo técnico lo retoma.'
            : 'Los pasos 2 y 3 los hace el técnico desde su celular; aquí verás el avance en el historial.'}
        </p>
      </form>

      <div className="mt-5 space-y-3 border-t border-borde pt-5">
        <h3 className="font-semibold">¿Reporte duplicado o falso?</h3>
        <Select
          id="motivo"
          label="Motivo"
          value={motivo}
          onChange={(e) => {
            setMotivo(e.target.value)
            setErrorMotivo(null)
          }}
          error={errorMotivo}
        >
          <option value="">Seleccionar…</option>
          {MOTIVOS_CANCELACION.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
        <Button variante="peligro" onClick={pedirConfirmacion} className="w-full">
          Cancelar ticket
        </Button>
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo={`¿Cancelar el ticket #${ticket.id}?`}
        textoConfirmar="Sí, cancelar"
        cargando={cancelando}
        onConfirmar={cancelar}
        onCerrar={() => setConfirmando(false)}
      >
        <p>Motivo: {motivo && minusculaInicial(motivo)}. Esta acción no se puede deshacer.</p>
      </ConfirmDialog>
    </Card>
  )
}
