// frontend/src/features/home/HomePage.tsx

import React, { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Message } from '@/components/ui/message';
import { Checkbox } from '@/components/ui/checkbox';
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
    const [emailMyPin, setEmailMyPin] = useState(false);
    const [status, setStatus] = useState<{ text: string; isError?: boolean } | null>(null);
    const emailIsValid = isValidEmail(email);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting || emailMyPin) return;
        setSubmitting(true);
        setStatus(null);

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

    const handleEmailMyPinChange = useCallback(
        async (nextChecked: boolean) => {
            if (submitting) return;

            if (!nextChecked) {
                setEmailMyPin(false);
                return;
            }

            if (!emailIsValid) {
                const warning = 'Please enter your email address to receive your PIN.';
                setEmailError(warning);
                setStatus({ text: warning, isError: true });
                setEmailMyPin(false);
                return;
            }

            setEmailError('');
            setStatus(null);
            setEmailMyPin(true);
            setSubmitting(true);

            try {
                await apiFetch(`/api/registrations/lost-pin?email=${encodeURIComponent(email)}`);
                setStatus({ text: 'Check your email in a few minutes.' });
            } catch (err: any) {
                const msg =
                    (err?.data?.error as string) ||
                    (typeof err?.message === 'string' ? err.message : 'Unable to send PIN email.');
                setStatus({ text: msg, isError: true });
            } finally {
                setSubmitting(false);
                setEmailMyPin(false);
                setPin('');
            }
        },
        [email, emailIsValid, submitting]
    );

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        const isValid = isValidEmail(value);
        setEmailError(value && !isValid ? 'Invalid email address' : '');
        if (status?.isError) {
            setStatus(null);
        }
    };

    const canSubmit = emailIsValid && pin.trim() !== '' && !submitting && !emailMyPin;
    const submitLabel = submitting ? (emailMyPin ? 'Sending…' : 'Signing in…') : 'Sign in';
    const emailPinDisabled = submitting || !emailIsValid;

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
                        {submitLabel}
                    </Button>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        Need help? Contact your conference organizer for assistance.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="email-my-pin"
                        checked={emailMyPin}
                        onCheckedChange={(checked) => {
                            void handleEmailMyPinChange(Boolean(checked));
                        }}
                        disabled={emailPinDisabled}
                    />
                    <Label
                        htmlFor="email-my-pin"
                        className={`text-sm${!emailIsValid ? ' text-muted-foreground' : ''}`}
                    >
                        Email my pin
                    </Label>
                </div>
            </form>

            {status && <Message text={status.text} isError={status.isError} />}
        </div>
    );
};

export default HomePage;
