'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PantallaAuth, { ErrorFormulario } from '@/components/layout/PantallaAuth.jsx'
import Button from '@/components/ui/Button.jsx'
import CampoContrasena from '@/components/ui/CampoContrasena.jsx'
import Field from '@/components/ui/Field.jsx'
import { useAuth } from '@/context/useAuth.js'
import { DOMINIO, errorCorreo, limpiarCorreo } from '@/utils/correo.js'
import { rutaInicio } from '@/utils/rutaInicio.js'

function validar({ correo, contrasena }) {
  const errores = {}
  const error = errorCorreo(correo)
  if (error) errores.correo = error
  if (!contrasena) errores.contrasena = 'Escribe tu contraseña.'
  return errores
}

export default function Login() {
  const { usuario, login } = useAuth()
  const router = useRouter()

  const [valores, setValores] = useState({ correo: '', contrasena: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Con sesión iniciada no tiene sentido ver el login
  const yaTieneSesion = Boolean(usuario) && !enviando
  useEffect(() => {
    if (yaTieneSesion) router.replace(rutaInicio(usuario.rol))
  }, [yaTieneSesion, usuario, router])

  function cambiar(evento) {
    const { name, value } = evento.target
    setValores((previos) => ({ ...previos, [name]: value }))
    if (errores[name]) setErrores((previos) => ({ ...previos, [name]: undefined }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErrorGeneral('')

    const nuevosErrores = validar(valores)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setEnviando(true)
    try {
      const usuarioActual = await login(limpiarCorreo(valores.correo), valores.contrasena)
      router.replace(rutaInicio(usuarioActual.rol))
    } catch (error) {
      setErrorGeneral(
        error.status === 401
          ? 'Correo o contraseña incorrectos. Inténtalo de nuevo.'
          : error.message || 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      )
      setEnviando(false)
    }
  }

  if (yaTieneSesion) return null

  return (
    <PantallaAuth titulo="Iniciar sesión" subtitulo="Entra con tu correo institucional.">
      <ErrorFormulario>{errorGeneral}</ErrorFormulario>

      <form noValidate onSubmit={enviar} className="mt-4 flex flex-col gap-5">
        <Field
          id="correo"
          name="correo"
          type="email"
          label="Correo institucional"
          placeholder={`nombre${DOMINIO}`}
          autoComplete="username"
          value={valores.correo}
          onChange={cambiar}
          error={errores.correo}
        />

        <CampoContrasena
          id="contrasena"
          name="contrasena"
          label="Contraseña"
          autoComplete="current-password"
          value={valores.contrasena}
          onChange={cambiar}
          error={errores.contrasena}
        />

        <Button type="submit" cargando={enviando} textoCargando="Entrando…" className="w-full">
          Entrar
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
        <Link
          href="/cambiar-contrasena"
          className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro"
        >
          Cambiar mi contraseña
        </Link>
        <p className="text-texto-2 md:whitespace-nowrap">¿La olvidaste? Pide a mantenimiento que la restablezca.</p>
      </div>

      <p className="mt-6 text-center md:mt-5 md:border-t md:border-borde md:pt-5 md:text-left">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="font-semibold underline underline-offset-2">
          Crear cuenta
        </Link>
      </p>
    </PantallaAuth>
  )
}
