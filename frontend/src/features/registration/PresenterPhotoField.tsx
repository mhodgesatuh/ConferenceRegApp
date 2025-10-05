// frontend/src/features/registration/PresenterPhotoField.tsx
//
// - Uses SVG placeholder by default
// - Preflights candidate /media URL with HEAD; only swaps <img> src on 200 OK
// - Remembers failed values (no re-tries)
// - Cache-buster is only applied after successful upload/remove

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import clsx from 'clsx';

import {Button, Label, Message} from '@/components/ui';
import type {FormField} from '@/data/registrationFormData';
import {useAppConfig} from '@/hooks/useAppConfig';
// If your build requires URL imports: add ?url
import presenterPlaceholder from '@/assets/presenter-placeholder.svg';
import {uploadPresenterPhoto} from './presenterPhotoApi';

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp';
const MAX_PREVIEW_SIZE = 50;
const DEFAULT_MAX_FILE_BYTES = 2 * 1024 * 1024;

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Number((bytes / 1024).toFixed(1))} KB`;
    return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`;
}

type PresenterPhotoFieldProps = {
    field: FormField;
    value: string;
    onChange: (value: string) => void;
    isMissing: boolean;
    error?: string;
};

export function PresenterPhotoField(
    {
        field,
        value,
        onChange,
        isMissing,
        error,
    }: PresenterPhotoFieldProps) {

    const [isUploading, setIsUploading] = useState(false);
    const [dialogMessage, setDialogMessage] = useState<string | null>(null);

    // Track values that have 404'd so we never retry.
    const failedValuesRef = useRef<Set<string>>(new Set());

    // Cache-buster token applied only after upload/remove.
    const cacheTokenRef = useRef<number | null>(null);
    // State mirror so effects can use it in deps.
    const [cacheVersion, setCacheVersion] = useState(0);

    // Current <img> src we actually render (starts at placeholder).
    const [resolvedSrc, setResolvedSrc] = useState<string>(presenterPlaceholder);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const { data: appConfigData } = useAppConfig();

    const maxFileBytes = appConfigData?.presenterMaxBytes ?? DEFAULT_MAX_FILE_BYTES;
    const maxFileReadable = useMemo(() => formatBytes(maxFileBytes), [maxFileBytes]);

    const showErrorStyle = isMissing || Boolean(error);
    const errorId = error ? `${field.name}-error` : undefined;

    // Compute candidate media URL (but we won't set <img src> to it until HEAD
    // passes)
    const candidateUrl = useMemo(() => {
        if (!value || failedValuesRef.current.has(value)) return null;
        const safe = value.startsWith('/') ? value.slice(1) : value;
        const v = cacheTokenRef.current ? `?v=${cacheTokenRef.current}` : '';
        return `/media/${safe}${v}`;
    }, [value, cacheVersion]);

    // Preflight with HEAD: if 200, swap <img> to the media URL; otherwise keep
    // placeholder and record failure.
    useEffect(() => {
        if (!candidateUrl) {
            setResolvedSrc(presenterPlaceholder);
            return;
        }
        const controller = new AbortController();
        (async () => {
            try {
                const res = await fetch(candidateUrl, { method: 'HEAD', signal: controller.signal });
                if (res.ok) {
                    setResolvedSrc(candidateUrl);
                } else {
                    if (value) failedValuesRef.current.add(value);
                    setResolvedSrc(presenterPlaceholder);
                }
            } catch {
                if (value) failedValuesRef.current.add(value);
                setResolvedSrc(presenterPlaceholder);
            }
        })();
        return () => controller.abort();
    }, [candidateUrl, value]);

    const handleFileChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            if (file.size > maxFileBytes) {
                setDialogMessage(
                    `That file is too large. Please choose one under ${maxFileReadable}.`,
                );
                event.target.value = '';
                return;
            }

            setIsUploading(true);
            try {
                const response = await uploadPresenterPhoto(file);
                if (!response?.presenterPicUrl) {
                    setDialogMessage('Upload succeeded but no file path was returned.');
                    return;
                }

                failedValuesRef.current.delete(response.presenterPicUrl);
                cacheTokenRef.current = Date.now();
                setCacheVersion((n) => n + 1);

                onChange(response.presenterPicUrl);
            } catch (err: any) {
                const message = err?.data?.error || err?.message || 'The photo could not be uploaded.';
                setDialogMessage(message);
            } finally {
                setIsUploading(false);
                event.target.value = '';
            }
        },
        [onChange, maxFileBytes, maxFileReadable],
    );

    const handleUploadClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleRemove = useCallback(() => {
        if (value) failedValuesRef.current.delete(value);
        onChange('');
        cacheTokenRef.current = Date.now();
        setCacheVersion((n) => n + 1);
        setResolvedSrc(presenterPlaceholder);
    }, [onChange, value]);

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
                        showErrorStyle ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-slate-100',
                    )}
                    aria-hidden
                >
                    <img
                        src={resolvedSrc}
                        alt={resolvedSrc === presenterPlaceholder ? 'Default presenter placeholder' : 'Presenter photo preview'}
                        className={clsx(
                            'h-full w-full rounded',
                            resolvedSrc === presenterPlaceholder ? 'object-contain' : 'object-cover',
                        )}
                        width={MAX_PREVIEW_SIZE}
                        height={MAX_PREVIEW_SIZE}
                        loading="lazy"
                        decoding="async"
                    />
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
                        Accepted formats: JPEG, PNG, WebP. Maximum size: {maxFileReadable}.
                    </p>
                    {isUploading && <p className="text-xs text-slate-600">Uploading photo…</p>}
                </div>
            </div>
            {error && <Message id={errorId} text={error} isError/>}
            {dialogMessage && (
                <PhotoErrorDialog message={dialogMessage} onClose={() => setDialogMessage(null)}/>
            )}
        </div>
    );
}

type PhotoErrorDialogProps = { message: string; onClose: () => void };

function PhotoErrorDialog({ message, onClose }: PhotoErrorDialogProps) {
    if (typeof document === 'undefined') return null;
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-w-sm rounded-lg bg-white p-4 shadow-lg">
                <h2 className="text-lg font-semibold text-slate-900">Photo upload problem</h2>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{message}</p>
                <div className="mt-4 flex justify-end">
                    <Button type="button" onClick={onClose}>Dismiss</Button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
