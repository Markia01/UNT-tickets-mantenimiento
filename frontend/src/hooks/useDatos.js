import { useCallback, useEffect, useState } from 'react'

const INICIAL = { datos: null, cargando: true, error: null, recibidoEn: null }

// Carga datos con una función de src/api y expone
// { datos, cargando, error, recibidoEn, reintentar }.
// `recibidoEn` es la fecha en que llegó la respuesta; sirve como "ahora" para
// calcular semáforos y fechas relativas sin llamar a `new Date()` al renderizar.
// `cargar` debe ser estable (una función del módulo o envuelta en useCallback).
export function useDatos(cargar) {
  const [estado, setEstado] = useState(INICIAL)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    cargar()
      .then((datos) => vigente && setEstado({ datos, cargando: false, error: null, recibidoEn: new Date() }))
      .catch((error) => vigente && setEstado({ datos: null, cargando: false, error, recibidoEn: null }))
    return () => {
      vigente = false
    }
  }, [cargar, intento])

  const reintentar = useCallback(() => {
    setEstado(INICIAL)
    setIntento((n) => n + 1)
  }, [])

  return { ...estado, reintentar }
}
