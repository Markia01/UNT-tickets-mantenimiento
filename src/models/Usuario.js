import mongoose from 'mongoose'

// Colección "usuarios". Los REPORTANTE se registran solos (/registro); los técnicos y
// administradores los da de alta un ADMIN en /admin/usuarios.
const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Contraseña cifrada con bcrypt. Nunca se devuelve en la API.
    contrasenaHash: { type: String, required: true },
    rol: { type: String, enum: ['ADMIN', 'TECNICO', 'REPORTANTE'], default: 'REPORTANTE' },
    // Solo REPORTANTE: Alumno, Docente o Personal
    tipo: { type: String, enum: ['Alumno', 'Docente', 'Personal'] },
    activo: { type: Boolean, default: true },
  },
  { collection: 'usuarios', timestamps: true },
)

// En desarrollo Next recarga los módulos: se reutiliza el modelo si ya existe
export default mongoose.models.Usuario ?? mongoose.model('Usuario', usuarioSchema)
