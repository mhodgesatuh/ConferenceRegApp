import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as fs from 'fs';
import * as path from 'path';

export default defineConfig(({ command, mode }) => {
    const isDev = command === 'serve';

    return {
        plugins: [react(), tsconfigPaths()],
        server: isDev
            ? {
                host: true,
                port: 3000,
                https: {
                    key: fs.readFileSync(path.resolve('/certs/localhost-key.pem')),
                    cert: fs.readFileSync(path.resolve('/certs/localhost.pem')),
                },
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
