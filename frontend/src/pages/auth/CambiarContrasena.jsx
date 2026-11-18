import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { cambiarContrasena } from '../../api/auth.js'
import PantallaAuth, { ErrorFormulario } from '../../components/layout/PantallaAuth.jsx'
import Button from '../../components/ui/Button.jsx'
import CampoContrasena from '../../components/ui/CampoContrasena.jsx'
import Field from '../../components/ui/Field.jsx'
import { useToast } from '../../components/ui/useToast.js'
import { DOMINIO, errorCorreo, limpiarCorreo } from '../../utils/correo.js'

const MINIMO = 8

function validar({ correo, actual, nueva, confirmar }) {
  const errores = {}
  const error = errorCorreo(correo)
  if (error) errores.correo = error
  if (!actual) errores.actual = 'Escribe tu contraseña actual.'
  if (!nueva) errores.nueva = 'Escribe la nueva contraseña.'
  else if (nueva.length < MINIMO) errores.nueva = `La nueva contraseña debe tener al menos ${MINIMO} caracteres.`
  if (!confirmar) errores.confirmar = 'Confirma la nueva contraseña.'
  else if (nueva && confirmar !== nueva) errores.confirmar = 'Las contraseñas no coinciden.'
  return errores
}

export default function CambiarContrasena() {
  const navigate = useNavigate()
  const toast = useToast()

  const [valores, setValores] = useState({ correo: '', actual: '', nueva: '', confirmar: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

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
      await cambiarContrasena(limpiarCorreo(valores.correo), valores.actual, valores.nueva)
      toast.exito('Contraseña actualizada')
      navigate('/login', { replace: true })
    } catch (error) {
      setErrorGeneral(
        error.status === 401
          ? 'La contraseña actual no es correcta. Revisa tu correo y contraseña e inténtalo de nuevo.'
          : error.message || 'No se pudo cambiar la contraseña. Inténtalo de nuevo.',
      )
      setEnviando(false)
    }
  }

  return (
    <PantallaAuth titulo="Cambiar contraseña" subtitulo="Escribe tu contraseña actual y elige una nueva.">
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
          id="actual"
          name="actual"
          label="Contraseña actual"
          autoComplete="current-password"
          value={valores.actual}
          onChange={cambiar}
          error={errores.actual}
        />

        <CampoContrasena
          id="nueva"
          name="nueva"
          label={`Nueva contraseña (mínimo ${MINIMO})`}
          autoComplete="new-password"
          value={valores.nueva}
          onChange={cambiar}
          error={errores.nueva}
        />

        <CampoContrasena
          id="confirmar"
          name="confirmar"
          label="Confirmar nueva contraseña"
          autoComplete="new-password"
          value={valores.confirmar}
          onChange={cambiar}
          error={errores.confirmar}
        />

        <Button type="submit" cargando={enviando} className="w-full">
          Cambiar contraseña
        </Button>
      </form>

      <p className="mt-4 text-center md:text-left">
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-negro"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </PantallaAuth>
  )
}
