import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import Button from '../../components/ui/Button.jsx'
import Field from '../../components/ui/Field.jsx'
import { useAuth } from '../../context/useAuth.js'
import { rutaInicio } from '../../utils/rutaInicio.js'

const DOMINIO = '@utnay.edu.mx'

function validar({ correo, contrasena }) {
  const errores = {}
  const correoLimpio = correo.trim().toLowerCase()
  if (!correoLimpio) {
    errores.correo = 'Escribe tu correo institucional.'
  } else if (!correoLimpio.endsWith(DOMINIO) || correoLimpio.length <= DOMINIO.length) {
    errores.correo = `El correo debe terminar en ${DOMINIO}`
  }
  if (!contrasena) errores.contrasena = 'Escribe tu contraseña.'
  return errores
}

export default function Login() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()

  const [valores, setValores] = useState({ correo: '', contrasena: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [enviando, setEnviando] = useState(false)

  // Con sesión iniciada no tiene sentido ver el login
  if (usuario && !enviando) return <Navigate to={rutaInicio(usuario.rol)} replace />

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
      const usuarioActual = await login(valores.correo.trim().toLowerCase(), valores.contrasena)
      navigate(rutaInicio(usuarioActual.rol), { replace: true })
    } catch (error) {
      setErrorGeneral(
        error.status === 401
          ? 'Correo o contraseña incorrectos. Inténtalo de nuevo.'
          : error.message || 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      )
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Panel negro: encabezado compacto en celular, mitad izquierda en escritorio */}
      <aside className="flex flex-col bg-negro px-6 py-9 text-crema md:min-h-screen md:w-1/2 md:p-12">
        <div className="flex h-12 w-[142px] items-center justify-center rounded-lg border border-dashed border-crema/40 md:h-[58px] md:w-[182px]">
          <span className="text-sm font-semibold tracking-[0.2em]">LOGO</span>
        </div>

        <div className="mt-6 md:my-auto md:max-w-md">
          <h1 className="text-[26px] leading-tight font-bold md:text-4xl">
            Reportes de mantenimiento
          </h1>
          <p className="mt-4 text-sm leading-relaxed md:text-base">
            <span className="md:hidden">Reporta fallas y sigue su atención.</span>
            <span className="hidden md:inline">
              Reporta fallas de aulas y equipos de la universidad y sigue su atención paso a paso.
            </span>
          </p>
        </div>

        <p className="hidden text-xs md:block">Universidad Tecnológica de Nayarit · 2026</p>
      </aside>

      {/* Formulario */}
      <main className="flex flex-1 justify-center bg-fondo px-6 py-7 md:items-center md:px-12">
        <div className="w-full max-w-[400px]">
          <h2 className="text-2xl font-bold md:text-[28px]">Iniciar sesión</h2>
          <p className="mt-1 hidden text-texto-2 md:block">Entra con tu correo institucional.</p>

          {errorGeneral && (
            <div
              role="alert"
              className="mt-4 rounded-lg bg-error-fondo px-3.5 py-3 text-[13px] font-semibold text-error-texto"
            >
              {errorGeneral}
            </div>
          )}

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

            <Field
              id="contrasena"
              name="contrasena"
              type={mostrarContrasena ? 'text' : 'password'}
              label="Contraseña"
              autoComplete="current-password"
              value={valores.contrasena}
              onChange={cambiar}
              error={errores.contrasena}
              accesorio={
                <button
                  type="button"
                  onClick={() => setMostrarContrasena((v) => !v)}
                  aria-pressed={mostrarContrasena}
                  aria-controls="contrasena"
                  className="min-h-11 rounded-lg px-3 text-[13px] font-semibold text-negro hover:bg-negro/5 focus-visible:outline-2 focus-visible:outline-negro"
                >
                  {mostrarContrasena ? 'Ocultar' : 'Mostrar'}
                </button>
              }
            />

            <Button type="submit" cargando={enviando} textoCargando="Entrando…" className="w-full">
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-xs leading-relaxed text-texto-2">
            ¿Olvidaste tu contraseña? Pide a mantenimiento que la restablezca.
          </p>

          <p className="mt-6 text-center md:mt-5 md:border-t md:border-borde md:pt-5 md:text-left">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold underline underline-offset-2">
              Crear cuenta
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
