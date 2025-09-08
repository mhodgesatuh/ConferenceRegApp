// frontend/src/features/home/HomePage.tsx

import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Checkbox} from '@/components/ui/checkbox-wrapper';
import {Message} from '@/components/ui/message';
import {isValidEmail} from '../registration/formRules';
import {apiFetch, saveCsrf} from '@/lib/api';

type LoginOk = { registration: any; csrf: string; csrfHeader?: string };

interface HomePageProps {
    onSuccess: (data: { registration: any }) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [requestsRegUpdate, setRequestsRegUpdate] = useState(false);
    const [emailPinChecked, setEmailPinChecked] = useState(false);
    const [pinMessage, setPinMessage] = useState<{ text: string; isError: boolean } | null>(null);
    const [emailError, setEmailError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        try {
            const data = await apiFetch("/api/registrations/login", {
                method: "POST",
                body: JSON.stringify({ email, pin }),
            });

            const { registration, csrf, csrfHeader } = data as LoginOk;

            // Persist CSRF for all subsequent modifying requests
            saveCsrf(csrf, csrfHeader || "x-csrf-token");

            // Only pass registration forward
            onSuccess({ registration }); // if you still need this callback elsewhere
            if (registration.isOrganizer) {
                navigate("/organizer", { state: { registration } });
            } else {
                navigate("/register", { state: { registration } });
            }
        } catch (err: any) {
            const msg =
                (err?.data?.error as string) ||
                (typeof err?.message === "string" ? err.message : "Invalid login");
            alert(msg);
        } finally {
            setSubmitting(false);
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
        if (!isValidEmail(email) || pin.trim() !== '') {
            // guard against accidental clicks
            setEmailPinChecked(false);
            return;
        }

        try {
            const params = new URLSearchParams({ email });
            // Lost PIN request occurs pre-login (no CSRF). We expect JSON { sent: true } on success.
            const res = await fetch(`/api/registrations/lost-pin?${params.toString()}`, {
                credentials: 'include',
            });

            let data: any = {};
            try {
                if ((res.headers.get('content-type') || '').includes('application/json')) {
                    data = await res.json();
                }
            } catch {
                /* ignore parse errors */
            }

            if (!res.ok || !data.sent) {
                const errorText = res.status === 404 ? 'Unknown email address' : (data.error ?? 'Please contact us');
                setPinMessage({ text: errorText, isError: true });
                setEmailPinChecked(false);
                return;
            }

            setPinMessage({ text: 'Sent as requested', isError: false });
        } catch (err) {
            console.error('Lost pin request failed', err);
            setPinMessage({ text: 'Please contact us', isError: true });
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
        if (pin.trim() !== '') {
            setEmailPinChecked(false);
            setPinMessage(null);
        }
    }, [pin]);

    const canSubmit = isValidEmail(email) && pin.trim() !== '' && !submitting;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center">
                <img src="/conference_intro.png" alt="Conference Logo" className="w-full"/>
            </div>

            {/* Primary action - only show when update is NOT selected */}
            {!requestsRegUpdate && (
                <div className="flex gap-2">
                    <Button type="button" onClick={goRegister}>
                        Register to Attend
                    </Button>
                </div>
            )}

            <Checkbox
                id="update-prev-reg"
                label="Update previous registration"
                checked={requestsRegUpdate}
                onCheckedChange={(val) => setRequestsRegUpdate(Boolean(val))}
            />

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
                            aria-invalid={Boolean(emailError)}
                            aria-describedby={emailError ? 'email-error' : undefined}
                        />
                        {emailError && <Message id="email-error" text={emailError} isError/>}
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
                        <Button type="submit" disabled={!canSubmit}>
                            {submitting ? 'Submitting…' : 'Submit'}
                        </Button>
                    </div>

                    <Checkbox
                        id="email-pin"
                        label="Please email my pin."
                        checked={emailPinChecked}
                        onCheckedChange={handleEmailPin}
                        disableUnless={isValidEmail(email) && pin.trim() === ''}
                    />

                    {pinMessage && <Message text={pinMessage.text} isError={pinMessage.isError}/>}
                </div>
            )}
        </form>
    );
};

export default HomePage;
