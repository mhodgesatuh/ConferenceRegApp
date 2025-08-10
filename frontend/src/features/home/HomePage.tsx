// frontend/src/features/home/HomePage.tsx
//

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox-wrapper'; // ⬅️ wrapper import
import { Message } from '@/components/ui/message';

interface HomePageProps {
    onSuccess: (registration: any) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [wantsUpdate, setWantsUpdate] = useState(false);
    const [emailPinChecked, setEmailPinChecked] = useState(false);
    const [pinMessage, setPinMessage] = useState<{ text: string; isError: boolean } | null>(null);
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

    const handleEmailPin = async (val: boolean) => {
        const checked = Boolean(val);
        setEmailPinChecked(checked);
        if (checked) {
            try {
                const params = new URLSearchParams({ email });
                const res = await fetch(`/api/registrations/lost-pin?${params.toString()}`);
                if (res.ok) {
                    setPinMessage({ text: 'Sent as requested', isError: false });
                } else {
                    setPinMessage({
                        text: 'Please contact PCATT for assistance.',
                        isError: true,
                    });
                }
            } catch (err) {
                console.error('Lost pin request failed', err);
                setPinMessage({
                    text: 'Please contact PCATT for assistance.',
                    isError: true,
                });
            }
        } else {
            setPinMessage(null);
        }
    };

    useEffect(() => {
        if (!email) {
            setEmailPinChecked(false);
            setPinMessage(null);
        }
    }, [email]);

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
                        <Button type="submit">Submit</Button>
                    </div>
                    <Checkbox
                        id="email-pin"
                        label="Please email my pin."
                        checked={emailPinChecked}
                        onCheckedChange={handleEmailPin}
                        disabled={!email}
                    />
                    {pinMessage && (
                        <Message text={pinMessage.text} isError={pinMessage.isError} />
                    )}
                </div>
            )}
        </form>
    );
};

export default HomePage;
