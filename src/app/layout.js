import Providers from './Providers.jsx'
import './globals.css'

// Sin `title`: cada pantalla pone el suyo con <title> (PageHeader, PantallaAuth,
// PaginaTemporal, 403). Si se define aquí, Next lo pone primero y gana.
export const metadata = {
  description: 'Reporte y seguimiento de fallas de infraestructura y equipo de la UTN',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
