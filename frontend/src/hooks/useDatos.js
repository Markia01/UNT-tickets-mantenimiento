import { useCallback, useEffect, useState } from 'react'

// Carga datos con una función de src/api y expone
// { datos, cargando, error, recibidoEn, reintentar, reemplazar }.
//
// - `cargar` debe ser estable (una función del módulo o envuelta en useCallback).
//   Cuando cambia (por ejemplo, porque cambiaron los filtros) se vuelve a cargar.
// - Mientras carga, `datos` conserva la respuesta anterior (útil para no hacer
//   parpadear conteos); la página decide si muestra Skeleton con `cargando`.
// - `recibidoEn` es la fecha en que llegó la respuesta; sirve como "ahora" para
//   calcular semáforos y fechas relativas sin llamar a `new Date()` al renderizar.
export function useDatos(cargar) {
  const [intento, setIntento] = useState(0)
  // `para` recuerda a qué petición (función + intento) corresponde la respuesta guardada
  const [estado, setEstado] = useState({ para: null, datos: null, error: null, recibidoEn: null })

  useEffect(() => {
    let vigente = true
    const para = { cargar, intento }
    cargar()
      .then((datos) => vigente && setEstado({ para, datos, error: null, recibidoEn: new Date() }))
      .catch((error) => vigente && setEstado((previo) => ({ ...previo, para, error })))
    return () => {
      vigente = false
    }
  }, [cargar, intento])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])

  // Sustituye los datos sin volver a cargar (p. ej. con el ticket que devolvió un PATCH)
  const reemplazar = useCallback(
    (datos) => setEstado((previo) => ({ ...previo, datos, error: null, recibidoEn: new Date() })),
    [],
  )

  const cargando = estado.para?.cargar !== cargar || estado.para?.intento !== intento
  return {
    datos: estado.datos,
    cargando,
    error: cargando ? null : estado.error,
    recibidoEn: estado.recibidoEn,
    reintentar,
    reemplazar,
  }
}
