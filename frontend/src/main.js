import { jsx as _jsx } from "react/jsx-runtime";
// frontend/src/main.tsx
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App'; // Ensure App.tsx exists and has a default export
const rootElement = document.getElementById('root');
if (!rootElement)
    throw new Error('Root element not found');
ReactDOM.createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
