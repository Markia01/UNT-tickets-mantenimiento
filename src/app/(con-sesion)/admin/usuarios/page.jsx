'use client'

import { Suspense, useCallback, useState } from 'react'
import { editarUsuario, getUsuarios, restablecerContrasena } from '@/api/usuarios.js'
import { IconoBuscar, IconoMas, IconoUsuarios } from '@/components/layout/iconos.jsx'
import CargandoPagina from '@/components/layout/CargandoPagina.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import Button from '@/components/ui/Button.jsx'
import CampoBusqueda from '@/components/ui/CampoBusqueda.jsx'
import Card from '@/components/ui/Card.jsx'
import ConfirmDialog from '@/components/ui/ConfirmDialog.jsx'
import EmptyState from '@/components/ui/EmptyState.jsx'
import Pill from '@/components/ui/Pill.jsx'
import Select from '@/components/ui/Select.jsx'
import Skeleton from '@/components/ui/Skeleton.jsx'
import { useToast } from '@/components/ui/useToast.js'
import { useAuth } from '@/context/useAuth.js'
import { useDatos } from '@/hooks/useDatos.js'
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl.js'
import { useTextoDiferido } from '@/hooks/useTextoDiferido.js'
import { nombreRol } from '@/utils/usuario.js'
import ModalContrasena from './_componentes/ModalContrasena.jsx'
import ModalUsuario from './_componentes/ModalUsuario.jsx'

const ROLES = ['ADMIN', 'TECNICO', 'REPORTANTE']

const CLASE_ACCION =
  'inline-flex min-h-11 items-center rounded-lg px-2 font-semibold whitespace-nowrap underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro'

function Estado({ activo }) {
  return (
    <Pill tipo="activo" valor={activo}>
      {activo ? 'Activo' : 'Inactivo'}
    </Pill>
  )
}

function Tipo({ usuario }) {
  if (usuario.rol === 'REPORTANTE' && usuario.tipo) return usuario.tipo
  return (
    <span className="text-texto-2">
      <span aria-hidden="true">—</span>
      <span className="sr-only">No aplica</span>
    </span>
  )
}

function MarcaTu() {
  return <span className="ml-2 rounded-full bg-crema px-2 py-0.5 text-xs font-semibold text-texto-2">Tú</span>
}

// Editar · Desactivar/Activar · Restablecer contraseña. Un admin no puede desactivarse a sí mismo.
function Acciones({ usuario, esUnoMismo, alAccion, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-1 ${className}`}>
      <button type="button" className={CLASE_ACCION} onClick={() => alAccion('editar', usuario)}>
        Editar<span className="sr-only"> a {usuario.nombre}</span>
      </button>
      {!esUnoMismo && (
        <button
          type="button"
          className={`${CLASE_ACCION} ${usuario.activo ? 'text-peligro' : ''}`}
          onClick={() => alAccion('activo', usuario)}
        >
          {usuario.activo ? 'Desactivar' : 'Activar'}
          <span className="sr-only"> a {usuario.nombre}</span>
        </button>
      )}
      <button type="button" className={CLASE_ACCION} onClick={() => alAccion('restablecer', usuario)}>
        Restablecer contraseña<span className="sr-only"> de {usuario.nombre}</span>
      </button>
    </div>
  )
}

function TablaUsuarios({ usuarios, idPropio, alAccion }) {
  return (
    <table className="hidden w-full border-separate border-spacing-0 text-left lg:table">
      <caption className="sr-only">Usuarios</caption>
      <thead>
        <tr>
          {['Nombre y correo', 'Rol', 'Tipo', 'Estado'].map((titulo) => (
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
        {usuarios.map((u) => (
          <tr key={u.id} className="hover:bg-crema [&:last-child>td]:border-b-0">
            <td className="border-b border-fondo px-3 py-3">
              <span className="font-semibold">{u.nombre}</span>
              {u.id === idPropio && <MarcaTu />}
              <span className="block break-all text-texto-2">{u.correo}</span>
            </td>
            <td className="border-b border-fondo px-3 py-3">
              <Pill tipo="rol" valor={u.rol} />
            </td>
            <td className="border-b border-fondo px-3 py-3">
              <Tipo usuario={u} />
            </td>
            <td className="border-b border-fondo px-3 py-3">
              <Estado activo={u.activo} />
            </td>
            <td className="border-b border-fondo px-3 py-1">
              <Acciones usuario={u} esUnoMismo={u.id === idPropio} alAccion={alAccion} className="justify-end" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TarjetasUsuarios({ usuarios, idPropio, alAccion }) {
  return (
    <ul className="space-y-3 lg:hidden">
      {usuarios.map((u) => (
        <li key={u.id} className="rounded-xl border border-borde bg-tarjeta p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 font-bold">
              {u.nombre}
              {u.id === idPropio && <MarcaTu />}
            </p>
            <Estado activo={u.activo} />
          </div>
          <p className="mt-1 break-all text-texto-2">{u.correo}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <Pill tipo="rol" valor={u.rol} />
            {u.rol === 'REPORTANTE' && u.tipo && <span className="text-texto-2">{u.tipo}</span>}
          </p>
          <Acciones
            usuario={u}
            esUnoMismo={u.id === idPropio}
            alAccion={alAccion}
            className="-mx-2 mt-2 border-t border-fondo pt-1"
          />
        </li>
      ))}
    </ul>
  )
}

function ListaCargando() {
  return (
    <div role="status" className="lg:rounded-xl lg:border lg:border-borde lg:bg-tarjeta lg:p-5">
      <span className="sr-only">Cargando usuarios…</span>
      <div className="hidden lg:block">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-fondo px-3 py-4 last:border-b-0">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-64" />
          </div>
        ))}
      </div>
      <div className="space-y-3 lg:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2.5 rounded-xl border border-borde bg-tarjeta p-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Textos del ConfirmDialog según la acción
function textosConfirmacion(accion, usuario) {
  if (!accion) return null
  if (accion === 'restablecer') {
    return {
      titulo: `¿Restablecer la contraseña de ${usuario.nombre}?`,
      texto: 'Se generará una contraseña temporal nueva y la actual dejará de funcionar.',
      confirmar: 'Sí, restablecer',
      variante: 'principal',
    }
  }
  if (usuario.activo) {
    return {
      titulo: `¿Desactivar a ${usuario.nombre}?`,
      texto:
        'No podrá iniciar sesión ni recibir tickets. Sus tickets y reportes se conservan, y puedes volver a activarlo cuando quieras.',
      confirmar: 'Sí, desactivar',
      variante: 'peligroLleno',
    }
  }
  return {
    titulo: `¿Activar a ${usuario.nombre}?`,
    texto: 'Podrá volver a iniciar sesión con su contraseña actual.',
    confirmar: 'Sí, activar',
    variante: 'principal',
  }
}

function Usuarios() {
  const toast = useToast()
  const { usuario: yo, actualizarUsuario } = useAuth()
  const { params, actualizar, consulta } = useFiltrosUrl()
  const filtros = {
    q: params.get('q') ?? '',
    rol: ROLES.includes(params.get('rol')) ? params.get('rol') : '',
  }

  const cargar = useCallback(() => getUsuarios(Object.fromEntries(new URLSearchParams(consulta))), [consulta])
  const { datos: usuarios, cargando, error, reintentar } = useDatos(cargar)

  const confirmarBusqueda = useCallback((q) => actualizar({ q }, { replace: true }), [actualizar])
  const [texto, setTexto] = useTextoDiferido(filtros.q, confirmarBusqueda)

  // { modo: 'nuevo' } | { modo: 'editar', usuario } | null
  const [modal, setModal] = useState(null)
  // { accion: 'activo' | 'restablecer', usuario } | null
  const [confirmacion, setConfirmacion] = useState(null)
  const [procesando, setProcesando] = useState(false)
  // { usuario, contrasena, motivo } | null
  const [contrasena, setContrasena] = useState(null)

  const hayFiltros = Boolean(filtros.q || filtros.rol)
  const limpiar = () => actualizar({ q: null, rol: null })

  function alAccion(accion, usuario) {
    if (accion === 'editar') setModal({ modo: 'editar', usuario })
    else setConfirmacion({ accion, usuario })
  }

  function alGuardar(respuesta) {
    const creando = modal?.modo === 'nuevo'
    setModal(null)
    reintentar()
    if (creando) {
      setContrasena({ usuario: respuesta.usuario, contrasena: respuesta.contrasenaTemporal, motivo: 'creado' })
    } else {
      // Si se editó a sí mismo, el encabezado debe mostrar el nombre nuevo
      if (respuesta.id === yo?.id) actualizarUsuario(respuesta)
      toast.exito('Cambios guardados')
    }
  }

  async function confirmar() {
    const { accion, usuario } = confirmacion
    setProcesando(true)
    try {
      if (accion === 'restablecer') {
        const { contrasenaTemporal } = await restablecerContrasena(usuario.id)
        setConfirmacion(null)
        setContrasena({ usuario, contrasena: contrasenaTemporal, motivo: 'restablecida' })
      } else {
        const actualizado = await editarUsuario(usuario.id, { activo: !usuario.activo })
        setConfirmacion(null)
        toast.exito(`${actualizado.nombre} quedó ${actualizado.activo ? 'activo' : 'inactivo'}`)
        reintentar()
      }
    } catch (error) {
      setConfirmacion(null)
      toast.error(error.message || 'No se pudo completar la acción. Inténtalo de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  const textos = confirmacion && textosConfirmacion(confirmacion.accion, confirmacion.usuario)

  return (
    <div className="space-y-4">
      <PageHeader titulo="Usuarios" />

      <section aria-label="Filtros" className="rounded-xl border border-borde bg-tarjeta p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:items-end">
          <CampoBusqueda
            id="buscar-usuario"
            label="Buscar usuario"
            placeholder="Nombre o correo"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="lg:min-w-48 lg:flex-1"
          />
          <Select
            id="filtro-rol"
            label="Rol"
            value={filtros.rol}
            onChange={(e) => actualizar({ rol: e.target.value })}
            className="lg:w-48"
          >
            <option value="">Todos</option>
            {ROLES.map((rol) => (
              <option key={rol} value={rol}>
                {nombreRol(rol)}
              </option>
            ))}
          </Select>
          <Button onClick={() => setModal({ modo: 'nuevo' })} className="min-h-12 gap-2 sm:col-span-2 lg:w-auto">
            <IconoMas className="size-[18px]" />
            Nuevo usuario
          </Button>
        </div>
      </section>

      <section aria-labelledby="titulo-usuarios">
        <h2 id="titulo-usuarios" className="sr-only">
          Lista de usuarios
        </h2>

        {cargando ? (
          <ListaCargando />
        ) : error ? (
          <Card className="mx-auto max-w-md text-center">
            <div role="alert">
              <p className="text-base font-semibold">No se pudieron cargar los usuarios</p>
              <p className="mt-1 text-texto-2">{error.message}</p>
            </div>
            <Button variante="secundario" className="mt-4" onClick={reintentar}>
              Reintentar
            </Button>
          </Card>
        ) : usuarios.length === 0 ? (
          <Card>
            {hayFiltros ? (
              <EmptyState
                icono={<IconoBuscar className="size-6" />}
                titulo="No hay usuarios con estos filtros"
                mensaje="Prueba con otra búsqueda o quita los filtros para ver a todos."
                accion={
                  <Button variante="secundario" onClick={limpiar}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icono={<IconoUsuarios className="size-6" />}
                titulo="Todavía no hay usuarios"
                mensaje="Da de alta a los técnicos y administradores con “Nuevo usuario”."
              />
            )}
          </Card>
        ) : (
          <div className="lg:rounded-xl lg:border lg:border-borde lg:bg-tarjeta lg:p-5">
            <TablaUsuarios usuarios={usuarios} idPropio={yo?.id} alAccion={alAccion} />
            <TarjetasUsuarios usuarios={usuarios} idPropio={yo?.id} alAccion={alAccion} />
            <p className="mt-4 text-xs leading-relaxed text-texto-2">
              Aquí solo se dan de alta técnicos y administradores; los alumnos, docentes y personal crean su cuenta en
              “Crear cuenta”. Un usuario inactivo no puede iniciar sesión ni recibir tickets.
            </p>
          </div>
        )}
      </section>

      <ModalUsuario
        abierto={Boolean(modal)}
        usuario={modal?.usuario}
        esUnoMismo={modal?.usuario?.id === yo?.id}
        onCerrar={() => setModal(null)}
        onGuardado={alGuardar}
      />

      <ConfirmDialog
        abierto={Boolean(confirmacion)}
        titulo={textos?.titulo}
        textoConfirmar={textos?.confirmar}
        variante={textos?.variante}
        cargando={procesando}
        onConfirmar={confirmar}
        onCerrar={() => setConfirmacion(null)}
      >
        <p>{textos?.texto}</p>
      </ConfirmDialog>

      <ModalContrasena datos={contrasena} onCerrar={() => setContrasena(null)} />
    </div>
  )
}

// useSearchParams necesita un <Suspense> alrededor (Next lo exige al compilar)
export default function Pagina() {
  return (
    <Suspense fallback={<CargandoPagina />}>
      <Usuarios />
    </Suspense>
  )
}
