// frontend/src/features/home/HomePage.tsx
//

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox-wrapper'; // ⬅️ wrapper import

interface HomePageProps {
    onSuccess: (registration: any) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [wantsUpdate, setWantsUpdate] = useState(false);
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

            <div className="flex justify-center">
                <img src="/pcatt-conference.png" alt="PCATT Logo" className="w-full" />
            </div>

            {/* Primary action */}
            <div className="flex gap-2">
                <Button type="button" onClick={goRegister}>Register to Attend</Button>
            </div>

            {/* Wrapper-based checkbox */}
            <Checkbox
                id="update-prev-reg"
                label="Update previous registration"
                checked={wantsUpdate}
                onCheckedChange={(val) => setWantsUpdate(Boolean(val))}
            />

            {/* Conditional update section */}
            {wantsUpdate && (
                <div id="update-section" className="space-y-4">
                    <hr className="my-4" />
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="pin">Pin</Label>
                        <Input
                            id="pin"
                            type="text"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            required
                            inputMode="numeric"
                            autoComplete="one-time-code"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit">Return to Registration</Button>
                    </div>
                </div>
            )}
        </form>
    );
};

export default HomePage;
