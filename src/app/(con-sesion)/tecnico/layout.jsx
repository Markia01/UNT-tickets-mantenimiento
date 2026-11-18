import RutaProtegida from '@/components/layout/RutaProtegida.jsx'

// Solo TECNICO
export default function LayoutTecnico({ children }) {
  return <RutaProtegida roles={['TECNICO']}>{children}</RutaProtegida>
}
