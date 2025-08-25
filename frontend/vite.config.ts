import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as fs from 'fs';
import * as path from 'path';

export default defineConfig(({ command }) => {
    const isDev = command === 'serve';

    const keyPath = path.resolve('/certs/localhost-key.pem');
    const certPath = path.resolve('/certs/localhost.pem');
    const httpsOptions =
        fs.existsSync(keyPath) && fs.existsSync(certPath)
            ? {
                  key: fs.readFileSync(keyPath),
                  cert: fs.readFileSync(certPath),
              }
            : undefined;

    return {
        plugins: [react(), tsconfigPaths()],
        server: isDev
            ? {
                  host: true,
                  port: 3000,
                  https: httpsOptions,
                  proxy: {
                      '/api': {
                          target: 'https://conference-backend:5000',
                          changeOrigin: true,
                          secure: false,
                      },
                  },
              }
            : undefined,
        build: {
            outDir: 'dist',
            emptyOutDir: true,
        },
    };
});
