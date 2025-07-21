import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface HomePageProps {
    onSuccess: (registration: any) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const params = new URLSearchParams({ email, pin });
            const res = await fetch(`/api/registrations/login?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                onSuccess(data.registration);
                navigate('/register', { state: { registration: data.registration } });
            } else {
                alert('Invalid login');
            }
        } catch (err) {
            console.error('Login failed', err);
            alert('Login failed');
        }
    };

    const goRegister = () => navigate('/register');

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1">
                <Label htmlFor="pin">Pin</Label>
                <Input id="pin" type="text" value={pin} onChange={(e) => setPin(e.target.value)} required />
            </div>
            <div className="flex gap-2">
                <Button type="submit">Login</Button>
                <Button type="button" onClick={goRegister}>Registration</Button>
            </div>
        </form>
    );
};

export default HomePage;
