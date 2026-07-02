import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/',
  build: { 
    outDir: 'dist',
    minify: true
  },
  plugins: [
    react(),
    tailwindcss()
  ],
  define: {
    'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(process.env.GOOGLE_MAPS_PLATFORM_KEY || '')
  },
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
