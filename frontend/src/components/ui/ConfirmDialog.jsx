import Button from './Button.jsx'
import Modal from './Modal.jsx'

// Confirmación de una acción destructiva (cancelar tickets, desactivar usuarios).
// El foco empieza en "Volver", la opción segura. Mientras `cargando`, el botón de
// confirmar dice "Guardando…" y el diálogo no se puede cerrar.
export default function ConfirmDialog({
  abierto,
  titulo,
  children,
  textoConfirmar = 'Sí, continuar',
  cargando = false,
  onConfirmar,
  onCerrar,
}) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      bloqueado={cargando}
      conCerrar={false}
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar} disabled={cargando} data-autofocus>
            Volver
          </Button>
          <Button variante="peligroLleno" onClick={onConfirmar} cargando={cargando}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="text-texto-2">{children}</div>
    </Modal>
  )
}
