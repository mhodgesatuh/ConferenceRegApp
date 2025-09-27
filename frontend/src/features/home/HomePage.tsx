// frontend/src/features/home/HomePage.tsx

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Message } from '@/components/ui/message';
import { isValidEmail } from '../registration/formRules';
import { apiFetch, saveCsrf } from '@/lib/api';

type LoginOk = { registration: any; csrf: string; csrfHeader?: string };

interface HomePageProps {
    onSuccess: (data: { registration: any }) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [emailError, setEmailError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        try {
            const data = await apiFetch('/api/registrations/login', {
                method: 'POST',
                body: JSON.stringify({ email, pin }),
            });

            const { registration, csrf, csrfHeader } = data as LoginOk;

            // Persist CSRF for all subsequent modifying requests
            saveCsrf(csrf, csrfHeader || 'x-csrf-token');

            // Notify parent about a successful login so it can handle routing/state
            onSuccess({ registration });
        } catch (err: any) {
            const msg =
                (err?.data?.error as string) ||
                (typeof err?.message === 'string' ? err.message : 'Invalid login');
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        setEmailError(value && !isValidEmail(value) ? 'Invalid email address' : '');
    };

    const canSubmit = isValidEmail(email) && pin.trim() !== '' && !submitting;

    return (
        <div className="space-y-6">
            <div className="flex justify-center">
                <img src="/conference_intro.png" alt="Conference Logo" className="w-full" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    {emailError && <Message id="email-error" text={emailError} isError />}
                </div>

                <div className="flex flex-col gap-1">
                    <Label htmlFor="pin">
                        PIN<sup className="text-red-500">*</sup>
                    </Label>
                    <Input
                        id="pin"
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                        autoComplete="one-time-code"
                        inputMode="numeric"
                    />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <Button type="submit" disabled={!canSubmit}>
                        {submitting ? 'Signing in…' : 'Sign in'}
                    </Button>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        Need help? Contact your conference organizer for assistance.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default HomePage;
