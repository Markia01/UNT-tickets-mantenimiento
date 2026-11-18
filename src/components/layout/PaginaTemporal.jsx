import PageHeader from '@/components/layout/PageHeader.jsx'

// Página provisional para las rutas que todavía no tienen pantalla.
// Dentro del layout muestra el encabezado de la página y una tarjeta;
// con `pantallaCompleta` (rutas públicas o 404) se centra en toda la pantalla.
export default function PaginaTemporal({ nombre, pantallaCompleta = false }) {
  const tarjeta = (
    <section className="w-full max-w-md rounded-xl border border-borde bg-tarjeta p-6">
      <p className="text-xs font-semibold text-texto-2">Página temporal</p>
      {pantallaCompleta ? (
        <h1 className="mt-1 text-base font-semibold">{nombre}</h1>
      ) : (
        <h2 className="mt-1 text-base font-semibold">{nombre}</h2>
      )}
      <p className="mt-2 text-texto-2">Esta vista todavía está en construcción.</p>
    </section>
  )

  if (!pantallaCompleta) {
    return (
      <>
        <PageHeader titulo={nombre} />
        {tarjeta}
      </>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <title>{`${nombre} · Tickets de Mantenimiento UTN`}</title>
      {tarjeta}
    </main>
  )
}
