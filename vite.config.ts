import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// TODO: si deployás en gh-pages bajo /<repo>/ seteá base: '/<repo>/'
export default defineConfig({
  plugins: [react()],
  base: '/examen-licencia-ar/', 
})
