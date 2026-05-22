import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['ylvwm5-3001.csb.app', '.csb.app'],
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['ylvwm5-3001.csb.app', '.csb.app'],
  },
});
