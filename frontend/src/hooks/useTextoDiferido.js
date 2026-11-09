import { useEffect, useState } from 'react'

// Texto de un buscador que se confirma `espera` ms después de dejar de escribir.
//
// - `valorConfirmado`: el valor vigente (por ejemplo, el de la URL).
// - `alConfirmar(texto)`: se llama con el texto ya recortado. Debe ser estable (useCallback).
// Si `valorConfirmado` cambia por otra vía (Limpiar, atrás/adelante), el texto se sincroniza.
export function useTextoDiferido(valorConfirmado, alConfirmar, espera = 300) {
  const [texto, setTexto] = useState(valorConfirmado)
  const [anterior, setAnterior] = useState(valorConfirmado)
  if (valorConfirmado !== anterior) {
    setAnterior(valorConfirmado)
    setTexto(valorConfirmado)
  }

  useEffect(() => {
    const limpio = texto.trim()
    if (limpio === valorConfirmado) return
    const temporizador = setTimeout(() => alConfirmar(limpio), espera)
    return () => clearTimeout(temporizador)
  }, [texto, valorConfirmado, alConfirmar, espera])

  return [texto, setTexto]
}
