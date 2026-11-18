import RutaProtegida from '@/components/layout/RutaProtegida.jsx'

// Solo ADMIN
export default function LayoutAdmin({ children }) {
  return <RutaProtegida roles={['ADMIN']}>{children}</RutaProtegida>
}
