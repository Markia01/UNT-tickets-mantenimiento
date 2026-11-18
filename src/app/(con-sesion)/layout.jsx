import AppLayout from '@/components/layout/AppLayout.jsx'
import RutaProtegida from '@/components/layout/RutaProtegida.jsx'

// La sesión vive en localStorage, así que estas pantallas solo se dibujan en el
// navegador: en el servidor RutaProtegida no muestra nada (ver next.config.mjs).
// Pantallas con sesión: primero se exige sesión y luego se pone el layout
// (menú lateral). Cada sección revisa además el rol en su propio layout.
export default function LayoutConSesion({ children }) {
  return (
    <RutaProtegida>
      <AppLayout>{children}</AppLayout>
    </RutaProtegida>
  )
}
