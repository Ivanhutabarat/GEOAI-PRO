import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/',
  build: { 
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-3d-geospatial': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-pdf-persistence': ['jspdf'],
          'vendor-lucide': ['lucide-react']
        }
      }
    }
  },
  plugins: [
    react(),
    tailwindcss()
  ],
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'lucide-react', 'recharts', 'framer-motion',
      'three', '@react-three/fiber', '@react-three/drei', 'jspdf',
      'zustand', 'react-router-dom', 'react-markdown', 'clsx', 'tailwind-merge'
    ]
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
});
