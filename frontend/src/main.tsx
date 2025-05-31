// frontend/src/main.tsx

import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App'; // Ensure App.tsx exists and has a default export

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
