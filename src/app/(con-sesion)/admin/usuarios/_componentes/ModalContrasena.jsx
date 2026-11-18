'use client'

import { useState } from 'react'
import { IconoCopiar, IconoPalomita } from '@/components/layout/iconos.jsx'
import Button from '@/components/ui/Button.jsx'
import Modal from '@/components/ui/Modal.jsx'

// Muestra UNA sola vez la contraseña temporal de un usuario (al crearlo o al restablecerla).
// `datos`: { usuario, contrasena, motivo: 'creado' | 'restablecida' } o null (cerrado).
// Al cerrar se pierde: la API no la vuelve a devolver.
export default function ModalContrasena({ datos, onCerrar }) {
  return (
    <Modal abierto={Boolean(datos)} onCerrar={onCerrar} titulo="Contraseña temporal">
      {datos && <Contenido key={datos.contrasena} datos={datos} onCerrar={onCerrar} />}
    </Modal>
  )
}

function Contenido({ datos, onCerrar }) {
  const { usuario, contrasena, motivo } = datos
  // null = sin intentar · 'ok' · 'error'
  const [copiado, setCopiado] = useState(null)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(contrasena)
      setCopiado('ok')
    } catch {
      setCopiado('error')
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-texto-2">
        {motivo === 'creado' ? (
          <>
            Se creó la cuenta de <strong className="text-negro">{usuario.nombre}</strong> ({usuario.correo}).
          </>
        ) : (
          <>
            Se restableció la contraseña de <strong className="text-negro">{usuario.nombre}</strong>. La anterior ya
            no funciona.
          </>
        )}
      </p>

      <div>
        <p id="contrasena-temporal-etiqueta" className="mb-1.5 text-xs font-semibold text-texto-2">
          Contraseña temporal
        </p>
        <div className="flex flex-wrap items-stretch gap-2">
          <output
            aria-labelledby="contrasena-temporal-etiqueta"
            className="flex min-h-12 flex-1 items-center rounded-lg border border-borde-campo bg-campo px-3.5 font-mono text-lg tracking-wider break-all select-all"
          >
            {contrasena}
          </output>
          <Button variante="secundario" onClick={copiar} className="gap-2" data-autofocus>
            {copiado === 'ok' ? <IconoPalomita className="size-[18px]" /> : <IconoCopiar className="size-[18px]" />}
            {copiado === 'ok' ? 'Copiada' : 'Copiar'}
          </Button>
        </div>
        <p aria-live="polite" className="mt-1.5 text-xs font-semibold">
          {copiado === 'ok' && 'Contraseña copiada al portapapeles.'}
          {copiado === 'error' && (
            <span className="text-peligro">No se pudo copiar. Selecciónala y cópiala a mano.</span>
          )}
        </p>
      </div>

      <div className="rounded-lg border border-aviso-punto bg-aviso-fondo px-3.5 py-3 text-aviso-texto">
        <p className="font-semibold">Cópiala ahora: no se volverá a mostrar.</p>
        <p className="mt-1 text-sm">
          Compártela con la persona por un medio seguro y pídele que la cambie en “Cambiar contraseña” al entrar.
        </p>
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={onCerrar}>Listo</Button>
      </div>
    </div>
  )
}
