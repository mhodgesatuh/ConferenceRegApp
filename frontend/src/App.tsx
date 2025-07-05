// frontend/src/App.tsx
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from './lib/queryClient';
import RegistrationForm from './features/registration/RegistrationForm';
// Enable for development only.
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="app">
                <h1>Conference Registration</h1>
                <RegistrationForm fields={[]}/>
            </div>

            {/* Render the Devtools */}
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
};

export default App;
