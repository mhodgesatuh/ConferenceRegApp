// frontend/src/features/home/HomePage.tsx
//

import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox-wrapper';
import {Message} from '@/components/ui/message';
import {isValidEmail} from '../registration/formRules';

interface HomePageProps {
    onSuccess: (registration: any) => void;
}

const HomePage: React.FC<HomePageProps> = ({onSuccess}) => {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [requestsRegUpdate, setRequestsRegUpdate] = useState(false);
    const [emailPinChecked, setEmailPinChecked] = useState(false);
    const [pinMessage, setPinMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const params = new URLSearchParams({email, pin});
            const res = await fetch(`/api/registrations/login?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                onSuccess(data.registration);
                navigate('/register', {state: {registration: data.registration}});
            } else {
                alert('Invalid login');
            }
        } catch (err) {
            console.error('Login failed', err);
            alert('Login failed');
        }
    };

    const goRegister = () => navigate('/register');

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        setEmailError(value && !isValidEmail(value) ? 'Invalid email address' : '');
    };

    const handleEmailPin = async (val: boolean) => {
        const checked = Boolean(val);
        setEmailPinChecked(checked);
        if (!checked) {
            setPinMessage(null);
            return;
        }

        try {
            const params = new URLSearchParams({email});
            const res = await fetch(
                `/api/registrations/lost-pin?${params.toString()}`,
            );
            let data: any = {};
            try {
                data = await res.json();
            } catch {
                /* ignore parse errors */
            }

            if (!res.ok || !data.sent) {
                setPinMessage({
                    text: data.error ?? 'Please contact PCATT',
                    isError: true,
                });
                setEmailPinChecked(false);
                return;
            }

            setPinMessage({text: 'Sent as requested', isError: false});
        } catch (err) {
            console.error('Lost pin request failed', err);
            setPinMessage({
                text: 'Please contact PCATT',
                isError: true,
            });
            setEmailPinChecked(false);
        }
    };

    useEffect(() => {
        if (!email) {
            setEmailPinChecked(false);
            setPinMessage(null);
        }
    }, [email]);

    useEffect(() => {
        if (!email) {
            setEmailPinChecked(false);
            setPinMessage(null);
        }
    }, [email]);

    useEffect(() => {
        if (pin.trim() !== '') {
            setEmailPinChecked(false);
            setPinMessage(null);
        }
    }, [pin]);

    const canSubmit = isValidEmail(email) && pin.trim() !== '';

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            <div className="flex justify-center">
                <img src="/conference_intro.png" alt="PCATT Logo" className="w-full"/>
            </div>

            {/* Primary action - only show when update is NOT selected */}
            {!requestsRegUpdate && (
                <div className="flex gap-2">
                    <Button type="button" onClick={goRegister}>
                        Register to Attend
                    </Button>
                </div>
            )}

            {/* Wrapper-based checkbox */}
            <Checkbox
                id="update-prev-reg"
                label="Update previous registration"
                checked={requestsRegUpdate}
                onCheckedChange={(val) => setRequestsRegUpdate(Boolean(val))}
            />

            {/* Conditional update section */}
            {requestsRegUpdate && (
                <div id="update-section" className="space-y-4">
                    <hr className="my-4"/>
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="email">
                            Email<sup className="text-red-500">*</sup>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            required
                            autoComplete="email"
                        />
                        {emailError && <Message text={emailError} isError />}
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label htmlFor="pin">
                            Pin<sup className="text-red-500">*</sup>
                        </Label>
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
                        <Button type="submit" disabled={!canSubmit}>Submit</Button>
                    </div>
                    <Checkbox
                        id="email-pin"
                        label="Please email my pin."
                        checked={emailPinChecked}
                        onCheckedChange={handleEmailPin}
                        disableUnless={isValidEmail(email) && pin.trim() === ''}
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
