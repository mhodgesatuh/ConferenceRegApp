// frontend/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element with id="root" not found');

ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    </React.StrictMode>
);
