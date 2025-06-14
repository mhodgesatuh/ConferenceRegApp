// frontend/src/App.tsx
import React from 'react';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from './lib/queryClient';
import RegistrationForm from './features/registration/RegistrationForm';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional, for dev use

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="app">
                <h1>Conference Registration</h1>
                <RegistrationForm fields={[]}/>
            </div>
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </QueryClientProvider>
    );
};

export default App;
