// Página temporal para comprobar que los colores de @theme funcionan
export default function PruebaColores() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fondo p-4">
      <section className="w-full max-w-md rounded-xl border border-borde bg-tarjeta p-6 text-negro">
        <h1 className="text-base font-semibold">Prueba de colores</h1>
        <p className="mt-2 text-texto-2">
          Si ves esta tarjeta en color crema sobre el fondo, los colores del proyecto están
          funcionando.
        </p>
        <button
          type="button"
          className="mt-4 min-h-11 rounded-lg bg-negro px-4 font-semibold text-crema"
        >
          Botón principal
        </button>
      </section>
    </main>
  )
}
