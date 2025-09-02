// backend/vitest.config.ts
import * as path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    test: {
        environment: 'node',
        include: ['src/tests/**/*.spec.ts'],   // run tests in src/tests
        exclude: ['node_modules/**'],          // keep the default ignore
        globals: true,
    },
});
