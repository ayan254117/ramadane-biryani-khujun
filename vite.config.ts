import { defineConfig } from 'vite'
import react from '@vitejs/react-refresh' // অথবা আপনার আগের ইম্পোর্টটি ঠিক রাখুন

export default defineConfig({
  server: {
    allowedHosts: ['ramadane-biryani-khujun.onrender.com']
  }
})
