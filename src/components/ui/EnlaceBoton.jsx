import Link from 'next/link'

const VARIANTES = {
  principal: 'border-negro bg-negro text-crema hover:bg-negro/90',
  secundario: 'border-negro bg-tarjeta text-negro hover:bg-negro/5',
}

// Enlace de navegación con el aspecto de <Button> (para ir a otra pantalla, no para acciones)
export default function EnlaceBoton({ href, variante = 'principal', className = '', children, ...props }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  )
}
