import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import RegForm from './RegForm';

function Home() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Welcome to the Conference</h1>
            <Link to="/register" className="text-blue-600 underline">Register Now</Link>
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<RegForm />} />
            </Routes>
        </Router>
    );
}
