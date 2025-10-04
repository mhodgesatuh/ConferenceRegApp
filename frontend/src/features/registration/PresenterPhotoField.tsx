// frontend/src/features/registration/PresenterPhotoField.tsx
//
// Custom field component for uploading and previewing presenter photos.
// Supports the following behaviours:
// 1) Uploading a new image via the /api/presenters/photo endpoint.
// 2) Showing an existing 50x50 preview (or a placeholder when missing).
// 3) Clearing the field so the picture can be removed.
// 4) Presenting dismissible error dialogs when an upload fails.

import React, {useCallback, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import clsx from 'clsx';

import {Button, Label, Message} from '@/components/ui';
import type {FormField} from '@/data/registrationFormData';
import {uploadPresenterPhoto} from './presenterPhotoApi';

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp';
const MAX_PREVIEW_SIZE = 50;
const MAX_FILE_BYTES = 2 * 1024 * 1024; // mirror backend default (2 MiB)
const MAX_FILE_MB = Math.round(MAX_FILE_BYTES / (1024 * 1024));

type PresenterPhotoFieldProps = {
    field: FormField;
    value: string;
    onChange: (value: string) => void;
    isMissing: boolean;
    error?: string;
};

export function PresenterPhotoField({ field, value, onChange, isMissing, error }: PresenterPhotoFieldProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [dialogMessage, setDialogMessage] = useState<string | null>(null);
    const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
    const inputRef = useRef<HTMLInputElement | null>(null);

    const showErrorStyle = isMissing || Boolean(error);
    const errorId = error ? `${field.name}-error` : undefined;

    const imageSrc = useMemo(() => {
        if (!value) return null;
        const safeValue = value.startsWith('/') ? value.slice(1) : value;
        const cacheParam = cacheBuster ? `?v=${cacheBuster}` : '';
        return `/media/${safeValue}${cacheParam}`;
    }, [value, cacheBuster]);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_BYTES) {
            setDialogMessage(`The selected file is too large. Please choose an image under ${MAX_FILE_MB} MB.`);
            event.target.value = '';
            return;
        }

        setIsUploading(true);
        try {
            const response = await uploadPresenterPhoto(file);
            if (!response?.presenterPicUrl) {
                throw new Error('Upload succeeded but no file path was returned.');
            }
            onChange(response.presenterPicUrl);
            setCacheBuster(Date.now());
        } catch (err: any) {
            const message = err?.data?.error || err?.message || 'The photo could not be uploaded.';
            setDialogMessage(message);
        } finally {
            setIsUploading(false);
            event.target.value = '';
        }
    }, [onChange]);

    const handleUploadClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleRemove = useCallback(() => {
        onChange('');
        setCacheBuster(Date.now());
    }, [onChange]);

    return (
        <div className="flex flex-col gap-1" aria-live="polite">
            <Label htmlFor={field.name}>
                {field.label}
                {field.required && <sup className="text-red-500">*</sup>}
            </Label>
            <div className="flex items-center gap-4">
                <div
                    className={clsx(
                        'flex h-[50px] w-[50px] items-center justify-center rounded border text-center text-[10px] font-semibold uppercase tracking-wide',
                        showErrorStyle ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-slate-100'
                    )}
                    aria-hidden
                >
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt="Presenter photo preview"
                            className="h-full w-full rounded object-cover"
                            width={MAX_PREVIEW_SIZE}
                            height={MAX_PREVIEW_SIZE}
                        />
                    ) : (
                        <span className="leading-tight text-red-700">No<br/>Photo</span>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <Button type="button" onClick={handleUploadClick} disabled={isUploading}>
                            {value ? 'Replace photo' : 'Upload photo'}
                        </Button>
                        <input
                            ref={inputRef}
                            id={field.name}
                            name={field.name}
                            type="file"
                            accept={ACCEPTED_TYPES}
                            className="hidden"
                            onChange={handleFileChange}
                            aria-describedby={errorId}
                        />
                        {value && (
                            <Button type="button" variant="secondary" onClick={handleRemove} disabled={isUploading}>
                                Remove photo
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-slate-600">
                        Accepted formats: JPEG, PNG, WebP. Maximum size: {MAX_FILE_MB} MB.
                    </p>
                    {isUploading && <p className="text-xs text-slate-600">Uploading photo…</p>}
                </div>
            </div>
            {error && <Message id={errorId} text={error} isError />}
            {dialogMessage && (
                <PhotoErrorDialog
                    message={dialogMessage}
                    onClose={() => setDialogMessage(null)}
                />
            )}
        </div>
    );
}

type PhotoErrorDialogProps = {
    message: string;
    onClose: () => void;
};

function PhotoErrorDialog({ message, onClose }: PhotoErrorDialogProps) {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-w-sm rounded-lg bg-white p-4 shadow-lg">
                <h2 className="text-lg font-semibold text-slate-900">Photo upload problem</h2>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{message}</p>
                <div className="mt-4 flex justify-end">
                    <Button type="button" onClick={onClose}>
                        Dismiss
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
