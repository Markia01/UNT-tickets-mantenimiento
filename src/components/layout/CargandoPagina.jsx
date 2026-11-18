import Skeleton from '../ui/Skeleton.jsx'

// Lo que se ve mientras una página espera a conocer la URL (fallback de <Suspense>)
export default function CargandoPagina() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Cargando…</span>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}
