'use client'

import { useState } from 'react'
import { crearCategoria, editarCategoria } from '@/api/categorias.js'
import Button from '@/components/ui/Button.jsx'
import Field from '@/components/ui/Field.jsx'
import Modal from '@/components/ui/Modal.jsx'
import { enfocarPrimerError } from '@/utils/formulario.js'

const MAX_NOMBRE = 40
const ORDEN_CAMPOS = ['categoria-nombre', 'categoria-horas']

function validar(valores) {
  const errores = {}
  const nombre = valores.nombre.trim()
  if (!nombre) errores['categoria-nombre'] = 'Escribe el nombre de la categoría.'
  else if (nombre.length > MAX_NOMBRE) errores['categoria-nombre'] = `Máximo ${MAX_NOMBRE} caracteres.`
  const horas = valores.horas.trim()
  if (!/^\d+$/.test(horas) || Number(horas) <= 0) {
    errores['categoria-horas'] = 'Escribe un número entero de horas mayor que 0.'
  }
  return errores
}

function FormCategoria({ categoria, onCancelar, onGuardado, onGuardando }) {
  const editando = Boolean(categoria)
  const [valores, setValores] = useState({
    nombre: categoria?.nombre ?? '',
    horas: categoria ? String(categoria.horasObjetivo) : '',
  })
  const [errores, setErrores] = useState({})
  const [errorApi, setErrorApi] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo, id) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }))
    setErrores((previos) => ({ ...previos, [id]: undefined }))
  }

  const horasCambiaron = editando && valores.horas.trim() !== String(categoria.horasObjetivo)

  async function guardar(e) {
    e.preventDefault()
    setErrorApi(null)
    const nuevosErrores = validar(valores)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) {
      enfocarPrimerError(nuevosErrores, ORDEN_CAMPOS)
      return
    }

    const nombre = valores.nombre.trim().replace(/\s+/g, ' ')
    const horasObjetivo = Number(valores.horas.trim())
    let datos = { nombre, horasObjetivo }
    if (editando) {
      // Solo se manda lo que cambió
      datos = {}
      if (nombre !== categoria.nombre) datos.nombre = nombre
      if (horasObjetivo !== categoria.horasObjetivo) datos.horasObjetivo = horasObjetivo
      if (Object.keys(datos).length === 0) {
        onCancelar()
        return
      }
    }

    setGuardando(true)
    onGuardando(true)
    try {
      const guardada = editando ? await editarCategoria(categoria.id, datos) : await crearCategoria(datos)
      onGuardando(false)
      onGuardado(guardada)
    } catch (error) {
      // Dentro de un modal el error va aquí: un aviso quedaría detrás del diálogo.
      // 409 (nombre repetido) se marca en el campo del nombre.
      if (error.status === 409) {
        setErrores({ 'categoria-nombre': error.message })
        document.getElementById('categoria-nombre')?.focus()
      } else {
        setErrorApi(error.message || 'No se pudo guardar. Inténtalo de nuevo.')
      }
      setGuardando(false)
      onGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="space-y-4">
      <Field
        id="categoria-nombre"
        label="Nombre"
        placeholder="Ej. Climatización"
        autoComplete="off"
        value={valores.nombre}
        onChange={cambiar('nombre', 'categoria-nombre')}
        error={errores['categoria-nombre']}
        maxLength={MAX_NOMBRE}
        data-autofocus
      />

      <div>
        <Field
          id="categoria-horas"
          label="Horas objetivo para atender"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          placeholder="Ej. 48"
          value={valores.horas}
          onChange={cambiar('horas', 'categoria-horas')}
          error={errores['categoria-horas']}
          className="sm:max-w-48"
        />
        {!errores['categoria-horas'] && (
          <p className="mt-1.5 text-xs text-texto-2">
            Con este número se calcula cuándo vence cada ticket (fecha del reporte + horas).
          </p>
        )}
      </div>

      {horasCambiaron && (
        <p
          role="status"
          className="rounded-lg border border-aviso-punto bg-aviso-fondo px-3.5 py-3 text-sm text-aviso-texto"
        >
          <strong>El cambio solo afecta a los tickets nuevos.</strong>{' '}
          {categoria.ticketsActivos > 0
            ? categoria.ticketsActivos === 1
              ? 'El ticket activo de esta categoría conserva su fecha de vencimiento.'
              : `Los ${categoria.ticketsActivos} tickets activos de esta categoría conservan su fecha de vencimiento.`
            : 'Los tickets que ya existen conservan su fecha de vencimiento.'}
        </p>
      )}

      {errorApi && (
        <p role="alert" className="rounded-lg bg-error-fondo px-3 py-2 font-semibold text-error-texto">
          {errorApi}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button variante="secundario" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="submit" cargando={guardando}>
          {editando ? 'Guardar cambios' : 'Guardar categoría'}
        </Button>
      </div>
    </form>
  )
}

// Modal para crear (sin `categoria`) o editar una categoría (con `categoria`).
export default function ModalCategoria({ abierto, categoria, onCerrar, onGuardado }) {
  const [guardando, setGuardando] = useState(false)

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={categoria ? 'Editar categoría' : 'Nueva categoría'}
      bloqueado={guardando}
    >
      {abierto && (
        <FormCategoria
          categoria={categoria}
          onCancelar={onCerrar}
          onGuardando={setGuardando}
          onGuardado={onGuardado}
        />
      )}
    </Modal>
  )
}
