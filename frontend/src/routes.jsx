import { createBrowserRouter } from 'react-router'
import PruebaColores from './pages/PruebaColores.jsx'

// Página temporal para comprobar los colores; se reemplaza al crear /login
export const router = createBrowserRouter([
  { path: '/', element: <PruebaColores /> },
])
