import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import EnlaceBoton from '../ui/EnlaceBoton.jsx'

// Qué mostrar cuando no se pudo cargar un ticket: no existe (404), no es tuyo (403) u otro error.
// `volver` = { href, texto } para el botón de los casos 404 y 403.
// `palabra`: cómo se le llama en esa vista ('reporte' para quien reporta, 'ticket' para el técnico).
export default function ErrorTicket({ id, error, reintentar, volver, textoAjeno, palabra = 'reporte' }) {
  if (error.status === 404 || error.status === 403) {
    const noExiste = error.status === 404
    return (
      <Card className="mx-auto max-w-md">
        <EmptyState
          titulo={noExiste ? `Este ${palabra} no existe` : `No puedes ver este ${palabra}`}
          mensaje={noExiste ? `No encontramos el #${id}. Revisa el número.` : (textoAjeno ?? error.message)}
          accion={
            <EnlaceBoton href={volver.href} variante="secundario">
              {volver.texto}
            </EnlaceBoton>
          }
        />
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-md text-center">
      <div role="alert">
        <p className="text-base font-semibold">No se pudo cargar el ticket #{id}</p>
        <p className="mt-1 text-texto-2">{error.message}</p>
      </div>
      <Button variante="secundario" className="mt-4" onClick={reintentar}>
        Reintentar
      </Button>
    </Card>
  )
}
