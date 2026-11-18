import RutaProtegida from '@/components/layout/RutaProtegida.jsx'

// Solo REPORTANTE
export default function LayoutReportante({ children }) {
  return <RutaProtegida roles={['REPORTANTE']}>{children}</RutaProtegida>
}
