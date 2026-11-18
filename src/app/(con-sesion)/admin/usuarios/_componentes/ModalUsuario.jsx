'use client'

import { useState } from 'react'
import { crearUsuario, editarUsuario } from '@/api/usuarios.js'
import Button from '@/components/ui/Button.jsx'
import Field from '@/components/ui/Field.jsx'
import Modal from '@/components/ui/Modal.jsx'
import Select from '@/components/ui/Select.jsx'
import { DOMINIO, errorCorreo, limpiarCorreo } from '@/utils/correo.js'
import { enfocarPrimerError } from '@/utils/formulario.js'
import { nombreRol } from '@/utils/usuario.js'

// Mantenimiento solo da de alta (o convierte en) técnicos y administradores;
// los reportantes se registran solos en /registro.
const ROLES_ASIGNABLES = ['TECNICO', 'ADMIN']
const ORDEN_CAMPOS = ['usuario-nombre', 'usuario-correo', 'usuario-rol']

function validar(valores, editando) {
  const errores = {}
  const nombre = valores.nombre.trim()
  if (nombre.length < 3) errores['usuario-nombre'] = 'Escribe el nombre completo.'
  if (!editando) {
    const error = errorCorreo(valores.correo)
    if (error) errores['usuario-correo'] = error
  }
  if (!valores.rol) errores['usuario-rol'] = 'Elige el rol.'
  return errores
}

function FormUsuario({ usuario, esUnoMismo, onCancelar, onGuardado, onGuardando }) {
  const editando = Boolean(usuario)
  const [valores, setValores] = useState({
    nombre: usuario?.nombre ?? '',
    correo: '',
    rol: usuario?.rol ?? '',
  })
  const [errores, setErrores] = useState({})
  const [errorApi, setErrorApi] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo, id) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }))
    setErrores((previos) => ({ ...previos, [id]: undefined }))
  }

  async function guardar(e) {
    e.preventDefault()
    setErrorApi(null)
    const nuevosErrores = validar(valores, editando)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) {
      enfocarPrimerError(nuevosErrores, ORDEN_CAMPOS)
      return
    }

    const nombre = valores.nombre.trim().replace(/\s+/g, ' ')
    let datos
    if (editando) {
      // Solo se manda lo que cambió
      datos = {}
      if (nombre !== usuario.nombre) datos.nombre = nombre
      if (valores.rol !== usuario.rol) datos.rol = valores.rol
      if (Object.keys(datos).length === 0) {
        onCancelar()
        return
      }
    } else {
      datos = { nombre, correo: limpiarCorreo(valores.correo), rol: valores.rol }
    }

    setGuardando(true)
    onGuardando(true)
    try {
      const respuesta = editando ? await editarUsuario(usuario.id, datos) : await crearUsuario(datos)
      onGuardando(false)
      onGuardado(respuesta)
    } catch (error) {
      // Dentro de un modal el error va aquí: un aviso quedaría detrás del diálogo.
      // 409 (correo repetido) se marca en el campo del correo.
      if (!editando && error.status === 409) {
        setErrores({ 'usuario-correo': error.message })
        document.getElementById('usuario-correo')?.focus()
      } else {
        setErrorApi(error.message || 'No se pudo guardar. Inténtalo de nuevo.')
      }
      setGuardando(false)
      onGuardando(false)
    }
  }

  // Un reportante conserva su rol mientras no se elija otro
  const opcionesRol = usuario?.rol === 'REPORTANTE' ? ['REPORTANTE', ...ROLES_ASIGNABLES] : ROLES_ASIGNABLES
  const pasaAPersonal = usuario?.rol === 'REPORTANTE' && valores.rol !== 'REPORTANTE'

  return (
    <form onSubmit={guardar} noValidate className="space-y-4">
      <Field
        id="usuario-nombre"
        label="Nombre completo"
        autoComplete="off"
        value={valores.nombre}
        onChange={cambiar('nombre', 'usuario-nombre')}
        error={errores['usuario-nombre']}
        maxLength={80}
        data-autofocus
      />

      {editando ? (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-texto-2">Correo</p>
          <p className="break-all">{usuario.correo}</p>
          <p className="mt-1 text-xs text-texto-2">El correo no se puede cambiar.</p>
        </div>
      ) : (
        <Field
          id="usuario-correo"
          label="Correo institucional"
          type="email"
          inputMode="email"
          autoComplete="off"
          placeholder={`nombre${DOMINIO}`}
          value={valores.correo}
          onChange={cambiar('correo', 'usuario-correo')}
          error={errores['usuario-correo']}
          maxLength={120}
        />
      )}

      <div>
        <Select
          id="usuario-rol"
          label="Rol"
          value={valores.rol}
          onChange={cambiar('rol', 'usuario-rol')}
          error={errores['usuario-rol']}
          disabled={esUnoMismo}
          // Solo se pasa si aplica: un aria-describedby undefined taparía el del error
          {...(esUnoMismo ? { 'aria-describedby': 'usuario-rol-nota' } : {})}
        >
          {!editando && <option value="">Seleccionar…</option>}
          {opcionesRol.map((rol) => (
            <option key={rol} value={rol}>
              {nombreRol(rol)}
            </option>
          ))}
        </Select>
        {esUnoMismo ? (
          <p id="usuario-rol-nota" className="mt-1.5 text-xs text-texto-2">
            No puedes cambiar tu propio rol.
          </p>
        ) : pasaAPersonal ? (
          <p className="mt-1.5 text-xs text-texto-2">
            Dejará de aparecer como {usuario.tipo ?? 'reportante'} y ya no podrá reportar fallas desde su cuenta.
          </p>
        ) : !editando ? (
          <p className="mt-1.5 text-xs text-texto-2">
            Los alumnos, docentes y personal crean su propia cuenta en “Crear cuenta”.
          </p>
        ) : null}
      </div>

      {!editando && (
        <p className="text-xs text-texto-2">Al guardar se genera una contraseña temporal que verás una sola vez.</p>
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
          {editando ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  )
}

// Modal para crear (sin `usuario`) o editar el nombre y el rol de un usuario (con `usuario`).
// Al crear, `onGuardado` recibe { usuario, contrasenaTemporal }; al editar, el usuario actualizado.
export default function ModalUsuario({ abierto, usuario, esUnoMismo = false, onCerrar, onGuardado }) {
  const [guardando, setGuardando] = useState(false)

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={usuario ? 'Editar usuario' : 'Nuevo usuario'}
      bloqueado={guardando}
    >
      {abierto && (
        <FormUsuario
          usuario={usuario}
          esUnoMismo={esUnoMismo}
          onCancelar={onCerrar}
          onGuardando={setGuardando}
          onGuardado={onGuardado}
        />
      )}
    </Modal>
  )
}
