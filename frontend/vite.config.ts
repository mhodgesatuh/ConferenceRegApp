import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    root: '.', // implicit if index.html is here
    plugins: [react()],
    server: {
        host: true,
        port: 3000
    }
});
