// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command }) => {
    const isDev = command === 'serve';

    return {
        plugins: [react(), tsconfigPaths()],
        server: isDev
            ? {
                host: true,
                port: 3000,
                // omit "https" so Vite serves HTTP by default
                proxy: {
                    '/api': {
                        target: 'https://localhost:8443', // nginx is TLS on 8443
                        changeOrigin: true,
                        secure: false, // accept self-signed
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
