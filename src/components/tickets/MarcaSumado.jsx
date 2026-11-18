import { IconoPersonas } from '../layout/iconos.jsx'

// Marca de los reportes a los que el usuario se sumó (no los creó).
// Borde punteado para que no se confunda con las etiquetas de estado.
export default function MarcaSumado() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-texto-2 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-texto-2">
      <IconoPersonas className="size-3.5" />
      Te sumaste
    </span>
  )
}
