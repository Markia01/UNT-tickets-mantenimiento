import { createContext, useContext } from 'react'

export const LayoutContext = createContext(null)

// Lo usa PageHeader para el botón ☰ del celular: { menuMovilAbierto, abrirMenuMovil }.
// Fuera de AppLayout (pantallas públicas) devuelve null y el botón no se muestra.
export function useLayout() {
  return useContext(LayoutContext)
}
