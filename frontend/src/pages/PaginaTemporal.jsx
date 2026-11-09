import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/useAuth.js'

// Página provisional para las rutas que todavía no tienen pantalla
export default function PaginaTemporal({ nombre }) {
  const { usuario, logout } = useAuth()

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md rounded-xl border border-borde bg-tarjeta p-6">
        <p className="text-xs font-semibold text-texto-2">Página temporal</p>
        <h1 className="mt-1 text-base font-semibold">{nombre}</h1>
        {usuario && (
          <>
            <p className="mt-2 text-texto-2">
              Sesión de {usuario.nombre} ({usuario.rol})
            </p>
            <Button variante="secundario" className="mt-4" onClick={logout}>
              Cerrar sesión
            </Button>
          </>
        )}
      </section>
    </main>
  )
}
