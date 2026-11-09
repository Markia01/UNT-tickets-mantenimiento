import { useState } from 'react'
import { crearEquipo, editarEquipo } from '../../../api/equipos.js'
import Button from '../../../components/ui/Button.jsx'
import Field from '../../../components/ui/Field.jsx'
import Modal from '../../../components/ui/Modal.jsx'
import Select from '../../../components/ui/Select.jsx'

const ORDEN_CAMPOS = ['tipo', 'descripcion', 'edificio', 'aula']

function validar(valores) {
  const errores = {}
  if (!valores.tipo) errores.tipo = 'Elige el tipo de equipo'
  if (!valores.descripcion.trim()) errores.descripcion = 'Escribe la descripción'
  if (!valores.edificio) errores.edificio = 'Elige el edificio'
  if (!valores.aula.trim()) errores.aula = 'Escribe el aula o espacio'
  return errores
}

function FormEquipo({ equipo, catalogos, onCancelar, onGuardado, onGuardando }) {
  const editando = Boolean(equipo)
  const [valores, setValores] = useState({
    tipo: equipo?.tipo ?? '',
    descripcion: equipo?.descripcion ?? '',
    edificio: equipo?.ubicacion.edificio ?? '',
    aula: equipo?.ubicacion.aula ?? '',
    estado: equipo?.estado ?? 'ACTIVO',
  })
  const [errores, setErrores] = useState({})
  const [errorApi, setErrorApi] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }))
    setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }

  async function guardar(e) {
    e.preventDefault()
    setErrorApi(null)
    const nuevosErrores = validar(valores)
    setErrores(nuevosErrores)
    const primero = ORDEN_CAMPOS.find((campo) => nuevosErrores[campo])
    if (primero) {
      document.getElementById(`equipo-${primero}`)?.focus()
      return
    }

    const datos = {
      tipo: valores.tipo,
      descripcion: valores.descripcion.trim(),
      ubicacion: { edificio: valores.edificio, aula: valores.aula.trim() },
      ...(editando ? { estado: valores.estado } : {}),
    }
    setGuardando(true)
    onGuardando(true)
    try {
      const guardado = editando ? await editarEquipo(equipo.id, datos) : await crearEquipo(datos)
      onGuardando(false)
      onGuardado(guardado)
    } catch (error) {
      // Dentro de un modal el error va aquí: un aviso quedaría detrás del diálogo
      setErrorApi(error.message || 'No se pudo guardar. Inténtalo de nuevo.')
      setGuardando(false)
      onGuardando(false)
    }
  }

  const sinCatalogos = !catalogos

  return (
    <form onSubmit={guardar} noValidate className="space-y-4">
      <Select
        id="equipo-tipo"
        label="Tipo de equipo"
        value={valores.tipo}
        onChange={cambiar('tipo')}
        error={errores.tipo}
        disabled={sinCatalogos}
        data-autofocus
      >
        <option value="">{sinCatalogos ? 'Cargando…' : 'Seleccionar…'}</option>
        {catalogos?.tiposEquipo.map((tipo) => (
          <option key={tipo} value={tipo}>
            {tipo}
          </option>
        ))}
      </Select>

      <Field
        id="equipo-descripcion"
        label="Descripción (marca, modelo o número)"
        placeholder="Ej. Equipo 12"
        value={valores.descripcion}
        onChange={cambiar('descripcion')}
        error={errores.descripcion}
        maxLength={120}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="equipo-edificio"
          label="Edificio"
          value={valores.edificio}
          onChange={cambiar('edificio')}
          error={errores.edificio}
          disabled={sinCatalogos}
        >
          <option value="">{sinCatalogos ? 'Cargando…' : 'Seleccionar…'}</option>
          {catalogos?.edificios.map((edificio) => (
            <option key={edificio} value={edificio}>
              {edificio}
            </option>
          ))}
        </Select>
        <Field
          id="equipo-aula"
          label="Aula o espacio"
          placeholder="Ej. Aula 3"
          value={valores.aula}
          onChange={cambiar('aula')}
          error={errores.aula}
          maxLength={60}
        />
      </div>

      {editando && (
        <div>
          <Select id="equipo-estado" label="Estado" value={valores.estado} onChange={cambiar('estado')}>
            <option value="ACTIVO">Activo</option>
            <option value="BAJA">Dado de baja</option>
          </Select>
          <p className="mt-1.5 text-xs text-texto-2">
            Al darlo de baja, su historial se conserva pero ya no aparece entre los activos.
          </p>
        </div>
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
          {editando ? 'Guardar cambios' : 'Guardar equipo'}
        </Button>
      </div>
    </form>
  )
}

// Modal para agregar (sin `equipo`) o editar un equipo (con `equipo`, añade el campo Estado).
// El formulario se monta cada vez que se abre, así que empieza limpio o con los datos actuales.
export default function ModalEquipo({ abierto, equipo, catalogos, onCerrar, onGuardado }) {
  const [guardando, setGuardando] = useState(false)

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={equipo ? 'Editar equipo' : 'Agregar equipo'}
      bloqueado={guardando}
    >
      {abierto && (
        <FormEquipo
          equipo={equipo}
          catalogos={catalogos}
          onCancelar={onCerrar}
          onGuardando={setGuardando}
          onGuardado={onGuardado}
        />
      )}
    </Modal>
  )
}
