import { Link } from 'react-router'

// Tarjeta de número: etiqueta, número grande y enlace. `peligro` pinta el número en rojo.
export default function StatCard({ etiqueta, valor, a, textoEnlace = 'Ver en Tickets →', peligro = false }) {
  return (
    <section className="rounded-xl border border-borde bg-tarjeta p-5">
      <h2 className="text-[13px] text-texto-2">{etiqueta}</h2>
      <p className={`mt-1 text-[32px] leading-tight font-bold ${peligro ? 'text-peligro' : ''}`}>{valor}</p>
      {a && (
        <Link
          to={a}
          aria-label={`${textoEnlace.replace(' →', '')}: ${etiqueta}`}
          className="mt-2 inline-flex min-h-6 items-center text-xs font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-negro"
        >
          {textoEnlace}
        </Link>
      )}
    </section>
  )
}
