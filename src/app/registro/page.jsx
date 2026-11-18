'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PantallaAuth, { ErrorFormulario } from '@/components/layout/PantallaAuth.jsx'
import Button from '@/components/ui/Button.jsx'
import CampoContrasena from '@/components/ui/CampoContrasena.jsx'
import Field from '@/components/ui/Field.jsx'
import GrupoOpciones from '@/components/ui/GrupoOpciones.jsx'
import { useAuth } from '@/context/useAuth.js'
import { DOMINIO, errorCorreo, limpiarCorreo } from '@/utils/correo.js'
import { enfocarPrimerError } from '@/utils/formulario.js'
import { rutaInicio } from '@/utils/rutaInicio.js'
import { TIPOS_REPORTANTE } from '@/utils/usuario.js'

const MINIMO = 8
const ORDEN = ['nombre', 'correo', 'tipo', 'contrasena', 'confirmar']

function validar({ nombre, correo, tipo, contrasena, confirmar }) {
  const errores = {}
  if (nombre.trim().length < 3) errores.nombre = 'Escribe tu nombre completo.'
  const error = errorCorreo(correo)
  if (error) errores.correo = error
  if (!tipo) errores.tipo = 'Elige si eres alumno, docente o personal.'
  if (!contrasena) errores.contrasena = 'Escribe una contraseña.'
  else if (contrasena.length < MINIMO) errores.contrasena = `La contraseña debe tener al menos ${MINIMO} caracteres.`
  if (!confirmar) errores.confirmar = 'Confirma tu contraseña.'
  else if (contrasena && confirmar !== contrasena) errores.confirmar = 'Las contraseñas no coinciden.'
  return errores
}

export default function Registro() {
  const { usuario, registrar } = useAuth()
  const router = useRouter()

  const [valores, setValores] = useState({ nombre: '', correo: '', tipo: '', contrasena: '', confirmar: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Con sesión iniciada no tiene sentido crear otra cuenta
  const yaTieneSesion = Boolean(usuario) && !enviando
  useEffect(() => {
    if (yaTieneSesion) router.replace(rutaInicio(usuario.rol))
  }, [yaTieneSesion, usuario, router])

  function cambiarValor(nombre, valor) {
    setValores((previos) => ({ ...previos, [nombre]: valor }))
    if (errores[nombre]) setErrores((previos) => ({ ...previos, [nombre]: undefined }))
  }

  const cambiar = (evento) => cambiarValor(evento.target.name, evento.target.value)

  async function enviar(evento) {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevosErrores = validar(valores)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) {
      enfocarPrimerError(nuevosErrores, ORDEN)
      return
    }

    setEnviando(true)
    try {
      await registrar({
        nombre: valores.nombre.trim(),
        correo: limpiarCorreo(valores.correo),
        tipo: valores.tipo,
        contrasena: valores.contrasena,
      })
      router.replace('/reportar')
    } catch (error) {
      if (error.status === 409) {
        setErrores({ correo: 'Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.' })
        document.getElementById('correo')?.focus()
      } else {
        setErrorGeneral(error.message || 'No se pudo crear la cuenta. Inténtalo de nuevo.')
      }
      setEnviando(false)
    }
  }

  if (yaTieneSesion) return null

  return (
    <PantallaAuth titulo="Crear cuenta" subtitulo="Regístrate con tu correo institucional para reportar fallas.">
      <ErrorFormulario>{errorGeneral}</ErrorFormulario>

      <form noValidate onSubmit={enviar} className="mt-4 flex flex-col gap-5">
        <Field
          id="nombre"
          name="nombre"
          label="Nombre completo"
          autoComplete="name"
          value={valores.nombre}
          onChange={cambiar}
          error={errores.nombre}
        />

        <Field
          id="correo"
          name="correo"
          type="email"
          label="Correo institucional"
          placeholder={`nombre${DOMINIO}`}
          autoComplete="email"
          value={valores.correo}
          onChange={cambiar}
          error={errores.correo}
        />

        <GrupoOpciones
          nombre="tipo"
          leyenda="Soy"
          opciones={TIPOS_REPORTANTE}
          valor={valores.tipo}
          onChange={(tipo) => cambiarValor('tipo', tipo)}
          error={errores.tipo}
        />

        <CampoContrasena
          id="contrasena"
          name="contrasena"
          label={`Contraseña (mínimo ${MINIMO})`}
          autoComplete="new-password"
          value={valores.contrasena}
          onChange={cambiar}
          error={errores.contrasena}
        />

        <CampoContrasena
          id="confirmar"
          name="confirmar"
          label="Confirmar contraseña"
          autoComplete="new-password"
          value={valores.confirmar}
          onChange={cambiar}
          error={errores.confirmar}
        />

        <Button type="submit" cargando={enviando} textoCargando="Creando cuenta…" className="w-full">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center md:mt-5 md:border-t md:border-borde md:pt-5 md:text-left">
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro"
        >
          Inicia sesión
        </Link>
      </p>
    </PantallaAuth>
  )
}
