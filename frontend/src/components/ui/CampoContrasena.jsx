import { useState } from 'react'
import Field from './Field.jsx'

// Campo de contraseña con el botón Mostrar/Ocultar a la derecha.
export default function CampoContrasena({ id, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <Field
      id={id}
      type={visible ? 'text' : 'password'}
      accesorio={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
          className="min-h-11 rounded-lg px-3 text-[13px] font-semibold text-negro hover:bg-negro/5 focus-visible:outline-2 focus-visible:outline-negro"
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      }
      {...props}
    />
  )
}
