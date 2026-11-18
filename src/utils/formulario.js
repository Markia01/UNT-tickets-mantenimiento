// Después de una validación fallida, lleva el foco al primer campo con error
// (en el orden de `orden`), para que el teclado y los lectores de pantalla lleguen al problema.
export function enfocarPrimerError(errores, orden) {
  const primero = orden.find((campo) => errores[campo])
  if (!primero) return
  const elemento = document.getElementById(primero) ?? document.querySelector(`[name="${primero}"]`)
  elemento?.focus()
}
