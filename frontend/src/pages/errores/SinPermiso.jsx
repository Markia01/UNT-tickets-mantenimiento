import { Link } from 'react-router'
import { useAuth } from '../../context/useAuth.js'
import { rutaInicio } from '../../utils/rutaInicio.js'

export default function SinPermiso() {
  const { rol } = useAuth()

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md rounded-xl border border-borde bg-tarjeta p-6 text-center">
        <p className="text-xs font-semibold text-texto-2">Error 403</p>
        <h1 className="mt-1 text-[26px] font-bold">No tienes permiso para ver esto</h1>
        <Link
          to={rutaInicio(rol)}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-negro px-4 text-base font-semibold text-crema hover:bg-negro/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}
