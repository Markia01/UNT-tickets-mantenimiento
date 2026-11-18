import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

// Filtros guardados en la URL (?vista=activos&edificio=Edificio%20A), para que se
// puedan compartir y sobrevivan al ir y volver de otra pantalla.
//
// actualizar({ edificio: 'Edificio A', tipo: null }) cambia esos parámetros
// (null o '' los borra). Cualquier cambio que no incluya `pagina` regresa a la página 1.
//
// Usa useSearchParams: la página que lo use debe ir dentro de <Suspense>.
export function useFiltrosUrl() {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const actualizar = useCallback(
    (cambios, { replace = false } = {}) => {
      // Se parte de la URL actual del navegador (no de `params`) para no perder
      // un cambio hecho justo antes que todavía no llega al render
      const siguientes = new URLSearchParams(window.location.search)
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) siguientes.set(clave, valor)
        else siguientes.delete(clave)
      }
      if (!('pagina' in cambios)) siguientes.delete('pagina')

      const texto = siguientes.toString()
      const url = texto ? `${pathname}?${texto}` : pathname
      // scroll: false para que cambiar un filtro no suba la página
      if (replace) router.replace(url, { scroll: false })
      else router.push(url, { scroll: false })
    },
    [pathname, router],
  )

  return { params, actualizar, consulta: params.toString() }
}
