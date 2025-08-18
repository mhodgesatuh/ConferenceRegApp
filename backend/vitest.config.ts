// backend/vitest.config.ts
import { defineConfig } from 'vitest/config';


export default defineConfig({
    test: {
        environment: 'node',
        exclude: ['src/tests/**', 'node_modules/**'],
        globals: true,
    },
});

