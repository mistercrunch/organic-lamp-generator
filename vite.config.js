import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: '/laser-cutter-lamp-generator/',
    plugins: [react()],
})

