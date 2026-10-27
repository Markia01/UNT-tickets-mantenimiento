# Guía para contribuir

## Flujo de trabajo

1. Toma un issue del tablero y asígnatelo.
2. Actualiza tu copia de `main`:
   ```bash
   git checkout main
   git pull
   ```
3. Crea una rama con el número del issue y una descripción corta:
   ```bash
   git checkout -b 12-formulario-reporte
   ```
4. Haz commits pequeños y frecuentes.
5. Sube tu rama y abre un pull request hacia `main`:
   ```bash
   git push -u origin 12-formulario-reporte
   ```
6. En la descripción del pull request escribe `Closes #12`.
7. Otra persona del equipo lo revisa y aprueba antes de fusionarlo.

**Nunca subas cambios directo a `main`.**

## Mensajes de commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/):

| Prefijo | Cuándo usarlo | Ejemplo |
| --- | --- | --- |
| `feat:` | Nueva funcionalidad | `feat: formulario de reporte` |
| `fix:` | Corrección de un error | `fix: cálculo de fecha de vencimiento` |
| `docs:` | Documentación | `docs: instrucciones de instalación` |
| `style:` | Formato, sin cambiar lógica | `style: aplicar prettier` |
| `refactor:` | Reorganizar código | `refactor: separar controlador de tickets` |
| `chore:` | Configuración y dependencias | `chore: agregar multer` |

## Antes de abrir un pull request

- [ ] `npm run lint` no muestra errores.
- [ ] Probaste tu cambio en el navegador.
- [ ] No subiste `.env`, `node_modules` ni fotos de `uploads/`.
