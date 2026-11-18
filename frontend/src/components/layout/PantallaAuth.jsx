import { useEffect } from 'react'

// Pantallas públicas de acceso (login, cambiar contraseña): panel negro con el
// logo a la izquierda (encabezado compacto en celular) y el formulario a la derecha.
export default function PantallaAuth({ titulo, subtitulo, children }) {
  useEffect(() => {
    document.title = `${titulo} · Tickets de Mantenimiento UTN`
  }, [titulo])

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col bg-negro px-6 py-9 text-crema md:min-h-screen md:w-1/2 md:p-12">
        <div className="flex h-12 w-[142px] items-center justify-center rounded-lg border border-dashed border-crema/40 md:h-[58px] md:w-[182px]">
          <span className="text-sm font-semibold tracking-[0.2em]">LOGO</span>
        </div>

        <div className="mt-6 md:my-auto md:max-w-md">
          <p className="text-[26px] leading-tight font-bold md:text-4xl">Reportes de mantenimiento</p>
          <p className="mt-4 text-sm leading-relaxed md:text-base">
            <span className="md:hidden">Reporta fallas y sigue su atención.</span>
            <span className="hidden md:inline">
              Reporta fallas de aulas y equipos de la universidad y sigue su atención paso a paso.
            </span>
          </p>
        </div>

        <p className="hidden text-xs md:block">Universidad Tecnológica de Nayarit · 2026</p>
      </aside>

      <main className="flex flex-1 justify-center bg-fondo px-6 py-7 md:items-center md:px-12">
        <div className="w-full max-w-[400px] md:max-w-[480px]">
          <h1 className="text-2xl font-bold md:text-[28px]">{titulo}</h1>
          {subtitulo && <p className="mt-1 hidden text-texto-2 md:block">{subtitulo}</p>}
          {children}
        </div>
      </main>
    </div>
  )
}

// Error general del formulario (credenciales incorrectas, sin conexión…)
export function ErrorFormulario({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="mt-4 rounded-lg bg-error-fondo px-3.5 py-3 text-[13px] font-semibold text-error-texto">
      {children}
    </div>
  )
}
