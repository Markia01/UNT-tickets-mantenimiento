'use client'

import { useState } from 'react'
import { cerrarTicket, marcarEnProceso } from '@/api/tecnico.js'
import AreaTexto from '@/components/ui/AreaTexto.jsx'
import Button from '@/components/ui/Button.jsx'
import CampoFoto from '@/components/ui/CampoFoto.jsx'
import Card from '@/components/ui/Card.jsx'
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx'
import { useToast } from '@/components/ui/useToast.js'
import { Foto } from '@/components/tickets/piezas.jsx'
import { formatearFechaCompleta } from '@/utils/fechas.js'
import { enfocarPrimerError } from '@/utils/formulario.js'

const MIN_COMENTARIO = 10
const MAX_COMENTARIO = 1000
const NOTA_SIN_PERMISOS = '¿No te corresponde este ticket? Avisa a mantenimiento para que lo reasigne.'

// Mensaje de un error de la API: si el ticket cambió (409), la página lo vuelve a cargar
function mensajeError(error, respaldo) {
  return error.message || respaldo
}

// ASIGNADO → botón "Marcar en proceso" con confirmación
function MarcarEnProceso({ ticket, onActualizado, onRecargar }) {
  const toast = useToast()
  const [confirmando, setConfirmando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  async function confirmar() {
    setGuardando(true)
    try {
      const actualizado = await marcarEnProceso(ticket.id)
      setConfirmando(false)
      toast.exito(`Ticket #${ticket.id} en proceso`)
      onActualizado(actualizado)
    } catch (error) {
      setConfirmando(false)
      toast.error(mensajeError(error, 'No se pudo marcar en proceso. Inténtalo de nuevo.'))
      if (error.status === 409 || error.status === 403) onRecargar()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Card titulo="Siguiente paso">
      <p className="text-texto-2">Cuando empieces a revisarlo, márcalo en proceso para que mantenimiento y quien reportó lo sepan.</p>
      <Button className="mt-4 w-full" onClick={() => setConfirmando(true)}>
        Marcar en proceso
      </Button>
      <p className="mt-4 text-xs text-texto-2">{NOTA_SIN_PERMISOS}</p>

      <ConfirmDialog
        abierto={confirmando}
        titulo={`¿Marcar el ticket #${ticket.id} en proceso?`}
        textoConfirmar="Sí, marcar en proceso"
        variante="principal"
        cargando={guardando}
        onConfirmar={confirmar}
        onCerrar={() => setConfirmando(false)}
      >
        Quien reportó y mantenimiento verán que ya lo estás atendiendo. Después podrás cerrarlo con una foto del arreglo.
      </ConfirmDialog>
    </Card>
  )
}

// EN_PROCESO → formulario de cierre con foto obligatoria y comentario
function FormularioCierre({ ticket, onActualizado, onRecargar }) {
  const toast = useToast()
  const [foto, setFoto] = useState(null)
  const [comentario, setComentario] = useState('')
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)

  function cambiarFoto(valor, error) {
    setFoto(valor)
    setErrores((previos) => ({ ...previos, 'foto-cierre': error }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    const nuevos = {}
    if (errores['foto-cierre']) nuevos['foto-cierre'] = errores['foto-cierre']
    else if (!foto) nuevos['foto-cierre'] = 'Toma una foto del arreglo: sin foto no se puede cerrar el ticket.'
    const largo = comentario.trim().length
    if (largo === 0) nuevos.comentario = 'Escribe qué se hizo para resolver la falla.'
    else if (largo < MIN_COMENTARIO) nuevos.comentario = `Escribe un poco más (mínimo ${MIN_COMENTARIO} caracteres).`
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      enfocarPrimerError(nuevos, ['foto-cierre', 'comentario'])
      return
    }

    setEnviando(true)
    try {
      const actualizado = await cerrarTicket(ticket.id, { foto: foto.archivo, comentario: comentario.trim() })
      toast.exito(`Ticket #${ticket.id} cerrado`)
      onActualizado(actualizado)
    } catch (error) {
      setEnviando(false)
      toast.error(mensajeError(error, 'No se pudo cerrar el ticket. Inténtalo de nuevo.'))
      if (error.status === 409 || error.status === 403) onRecargar()
    }
  }

  return (
    <Card titulo="Cerrar ticket">
      <form noValidate onSubmit={enviar} className="space-y-4">
        <CampoFoto
          id="foto-cierre"
          label="Foto del arreglo"
          valor={foto}
          onChange={cambiarFoto}
          error={errores['foto-cierre']}
          obligatoria
        />
        <AreaTexto
          id="comentario"
          label="¿Qué se hizo?"
          placeholder="Ej.: Se cambió la lámpara del proyector y se probó con la computadora del aula."
          value={comentario}
          onChange={(e) => {
            setComentario(e.target.value)
            if (errores.comentario) setErrores((previos) => ({ ...previos, comentario: undefined }))
          }}
          minimo={MIN_COMENTARIO}
          maximo={MAX_COMENTARIO}
          error={errores.comentario}
        />
        <Button type="submit" cargando={enviando} textoCargando="Cerrando…" className="w-full">
          Cerrar ticket
        </Button>
      </form>
      <p className="mt-4 text-xs text-texto-2">{NOTA_SIN_PERMISOS}</p>
    </Card>
  )
}

// CERRADO → evidencia del cierre
function Cierre({ ticket }) {
  return (
    <Card titulo="Cierre">
      <Foto src={ticket.fotoCierre} alt={`Foto de cierre del ticket #${ticket.id}`} etiqueta="Foto del arreglo" />
      <p className="mt-4 text-xs text-texto-2">Qué se hizo</p>
      <p className="mt-0.5 whitespace-pre-line">{ticket.comentarioCierre || 'Sin comentario.'}</p>
      <p className="mt-3 text-xs text-texto-2">Cerrado el {formatearFechaCompleta(ticket.cerradoEn)}.</p>
    </Card>
  )
}

// Lo que el técnico puede hacer según el estado. No puede asignar, reasignar ni cancelar.
export default function AccionesTecnico({ ticket, onActualizado, onRecargar }) {
  if (ticket.estado === 'ASIGNADO') {
    return <MarcarEnProceso ticket={ticket} onActualizado={onActualizado} onRecargar={onRecargar} />
  }
  if (ticket.estado === 'EN_PROCESO') {
    return <FormularioCierre ticket={ticket} onActualizado={onActualizado} onRecargar={onRecargar} />
  }
  if (ticket.estado === 'CERRADO') return <Cierre ticket={ticket} />
  return null
}
