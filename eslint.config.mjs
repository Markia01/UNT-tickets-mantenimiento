import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    // Ignorados por defecto de eslint-config-next
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // El backend de Express tiene su propio ESLint (backend/eslint.config.js)
    'backend/**',
  ]),
])

export default eslintConfig
