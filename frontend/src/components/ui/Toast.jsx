import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconoAlerta, IconoCerrar, IconoPalomita } from '../layout/iconos.jsx'
import { ToastContext } from './useToast.js'

const DURACION_MS = 4000

function Aviso({ aviso, onCerrar }) {
  // Cada aviso se quita solo a los 4 segundos
  useEffect(() => {
    const espera = setTimeout(() => onCerrar(aviso.id), DURACION_MS)
    return () => clearTimeout(espera)
  }, [aviso.id, onCerrar])

  const exito = aviso.tipo === 'exito'
  return (
    <div
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg py-2 pr-2 pl-4 shadow-lg ${
        exito ? 'bg-negro text-crema' : 'border border-error-punto/40 bg-error-fondo text-error-texto'
      }`}
    >
      {exito ? (
        <IconoPalomita className="mt-2.5 size-5 text-ok-punto" />
      ) : (
        <IconoAlerta className="mt-2.5 size-5" />
      )}
      <p className={`flex-1 py-2.5 ${exito ? '' : 'font-semibold'}`}>{aviso.mensaje}</p>
      <button
        type="button"
        onClick={() => onCerrar(aviso.id)}
        aria-label="Cerrar aviso"
        className={`flex size-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 ${
          exito ? 'hover:bg-crema/10 focus-visible:outline-crema' : 'hover:bg-error-texto/10 focus-visible:outline-error-texto'
        }`}
      >
        <IconoCerrar className="size-4" />
      </button>
    </div>
  )
}

// Avisos arriba a la derecha. Las dos regiones vivas existen desde el inicio para que
// los lectores de pantalla anuncien lo que se agregue: éxito en role="status" (cortés)
// y error en role="alert" (inmediato).
export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const siguienteId = useRef(0)

  const cerrar = useCallback((id) => setAvisos((lista) => lista.filter((a) => a.id !== id)), [])

  const mostrar = useCallback((tipo, mensaje) => {
    siguienteId.current += 1
    const id = siguienteId.current
    setAvisos((lista) => [...lista, { id, tipo, mensaje }])
  }, [])

  const valor = useMemo(
    () => ({
      exito: (mensaje) => mostrar('exito', mensaje),
      error: (mensaje) => mostrar('error', mensaje),
    }),
    [mostrar],
  )

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 left-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-[420px]">
        <div role="alert" className="flex w-full flex-col gap-2">
          {avisos
            .filter((a) => a.tipo === 'error')
            .map((a) => (
              <Aviso key={a.id} aviso={a} onCerrar={cerrar} />
            ))}
        </div>
        <div role="status" className="flex w-full flex-col gap-2">
          {avisos
            .filter((a) => a.tipo === 'exito')
            .map((a) => (
              <Aviso key={a.id} aviso={a} onCerrar={cerrar} />
            ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}
