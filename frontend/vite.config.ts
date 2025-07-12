// frontend/vite.config.ts
import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        root: '.', // implicit
        plugins: [react(), tsconfigPaths()],
        server: {
            host: true,
            port: parseInt(env.UI_PORT) || 3000,
        },
        build: {
            outDir: 'dist',        // ← explicit output folder
            emptyOutDir: true,     // ← removes old files before building
        },
    };
});
