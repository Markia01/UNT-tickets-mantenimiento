import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

// Filtros guardados en la URL (?vista=activos&edificio=Edificio%20A), para que se
// puedan compartir y sobrevivan al ir y volver de otra pantalla.
//
// actualizar({ edificio: 'Edificio A', tipo: null }) cambia esos parámetros
// (null o '' los borra). Cualquier cambio que no incluya `pagina` regresa a la página 1.
export function useFiltrosUrl() {
  const [params, setParams] = useSearchParams()

  const actualizar = useCallback(
    (cambios, { replace = false } = {}) => {
      setParams(
        (previos) => {
          const siguientes = new URLSearchParams(previos)
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor) siguientes.set(clave, valor)
            else siguientes.delete(clave)
          }
          if (!('pagina' in cambios)) siguientes.delete('pagina')
          return siguientes
        },
        { replace },
      )
    },
    [setParams],
  )

  return { params, actualizar, consulta: params.toString() }
}
