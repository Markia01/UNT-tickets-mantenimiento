// Barra gris de carga. El contenedor que la usa debe anunciar "Cargando…"
// (por ejemplo con role="status"); las barras se ocultan a lectores de pantalla.
export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-borde motion-reduce:animate-none ${className}`} />
}
