// Íconos SVG de línea (trazo 1.8). Son decorativos: el texto o el aria-label
// del botón que los contiene da el nombre accesible.
function Icono({ children, className = 'size-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  )
}

export function IconoMenu(props) {
  return (
    <Icono {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icono>
  )
}

export function IconoCerrar(props) {
  return (
    <Icono {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icono>
  )
}

export function IconoInicio(props) {
  return (
    <Icono {...props}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5 9v11h5v-6h4v6h5V9" />
    </Icono>
  )
}

export function IconoTickets(props) {
  return (
    <Icono {...props}>
      <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V7z" />
      <path d="M14 5v12" strokeDasharray="2 2" />
    </Icono>
  )
}

export function IconoEquipos(props) {
  return (
    <Icono {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </Icono>
  )
}

export function IconoUsuarios(props) {
  return (
    <Icono {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0113 0" />
      <path d="M16 4.5a3.5 3.5 0 010 7M18 14.5a6.5 6.5 0 013.5 5.5" />
    </Icono>
  )
}

export function IconoCategorias(props) {
  return (
    <Icono {...props}>
      <path d="M3 12V4a1 1 0 011-1h8l9 9-9 9-9-9z" />
      <circle cx="8" cy="8" r="1.5" />
    </Icono>
  )
}

export function IconoHerramienta(props) {
  return (
    <Icono {...props}>
      <path d="M14.5 6.5a4 4 0 005 5L21 13l-8 8-3-3 6.5-6.5" />
      <path d="M14.5 6.5L13 5a4 4 0 00-5.5 5.5L3 15v3h3l4.5-4.5" />
    </Icono>
  )
}

export function IconoReportar(props) {
  return (
    <Icono {...props}>
      <path d="M12 3l9.5 17h-19L12 3z" />
      <path d="M12 10v4M12 17.5v.01" />
    </Icono>
  )
}

export function IconoLista(props) {
  return (
    <Icono {...props}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </Icono>
  )
}

export function IconoCerrarSesion(props) {
  return (
    <Icono {...props}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Icono>
  )
}

export function IconoLlave(props) {
  return (
    <Icono {...props}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l3 3M15 8l2 2" />
    </Icono>
  )
}

export function IconoFlechaAbajo(props) {
  return (
    <Icono {...props}>
      <path d="M6 9l6 6 6-6" />
    </Icono>
  )
}

export function IconoPalomita(props) {
  return (
    <Icono {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icono>
  )
}

export function IconoBuscar(props) {
  return (
    <Icono {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </Icono>
  )
}

export function IconoFiltros(props) {
  return (
    <Icono {...props}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </Icono>
  )
}

export function IconoAlerta(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.01" />
    </Icono>
  )
}

export function IconoMas(props) {
  return (
    <Icono {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icono>
  )
}

export function IconoAdvertencia(props) {
  return (
    <Icono {...props}>
      <path d="M12 3.5l9.5 16.5h-19L12 3.5z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </Icono>
  )
}

export function IconoAire(props) {
  return (
    <Icono {...props}>
      <rect x="3" y="5" width="18" height="8" rx="2" />
      <path d="M7 10h10M8 16.5l-1 2.5M12 16.5V19M16 16.5l1 2.5" />
    </Icono>
  )
}

export function IconoProyector(props) {
  return (
    <Icono {...props}>
      <rect x="2.5" y="8" width="19" height="9" rx="2" />
      <circle cx="15.5" cy="12.5" r="2.5" />
      <path d="M6 12.5h4M6 17v2M18 17v2" />
    </Icono>
  )
}

export function IconoFoco(props) {
  return (
    <Icono {...props}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z" />
    </Icono>
  )
}

export function IconoEnchufe(props) {
  return (
    <Icono {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M10 9v2M14 9v2M9.5 15h5" />
    </Icono>
  )
}

export function IconoGota(props) {
  return (
    <Icono {...props}>
      <path d="M12 3.5s6 6.6 6 10.5a6 6 0 01-12 0c0-3.9 6-10.5 6-10.5z" />
    </Icono>
  )
}

export function IconoPizarron(props) {
  return (
    <Icono {...props}>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20l2-4M16 20l-2-4M7 9h6M7 12h4" />
    </Icono>
  )
}

const ICONO_POR_TIPO = {
  'Aire acondicionado': IconoAire,
  Proyector: IconoProyector,
  Computadora: IconoEquipos,
  Luminaria: IconoFoco,
  'Contacto eléctrico': IconoEnchufe,
  'Instalación hidráulica': IconoGota,
  Pizarrón: IconoPizarron,
}

// Ícono según el tipo de equipo (o uno genérico si el tipo no está en la lista)
export function IconoTipoEquipo({ tipo, ...props }) {
  const Componente = ICONO_POR_TIPO[tipo] ?? IconoEquipos
  return <Componente {...props} />
}
