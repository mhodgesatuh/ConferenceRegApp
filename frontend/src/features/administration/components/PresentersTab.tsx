// frontend/src/features/administration/components/PresentersTab.tsx

import React, {useCallback, useEffect, useId, useMemo, useRef, useState} from "react";
import {Copy} from "lucide-react";

import {cn} from "@/lib/utils";
import presenterPlaceholder from "@/assets/presenter-placeholder.svg";
import type {Registration} from "../types";
import {formatFullName} from "../utils/formatName";
import {Button} from "@/components/ui/button";

type PresentersTabProps = {
    presenters: Registration[];
    isLoading: boolean;
    error: string | null;
};

type CopyButtonProps = {
    text: string;
    label: string;
};

const CopyButton: React.FC<CopyButtonProps> = ({ text, label }) => {
    const [copied, setCopied] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const timeoutRef = useRef<number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const instructionsId = useId();

    // Optional helper to ensure focus/select when the manual UI opens.
    // (You can remove this if you prefer relying solely on autoFocus+onFocus below.)
    const openManualUI = useCallback(() => {
        setShowManual(true);
        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        });
    }, []);

    // Close on Escape (attached to the input so it always receives keys)
    const handleManualKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Escape") setShowManual(false);
    }, []);

    // Click outside to dismiss
    useEffect(() => {
        if (!showManual) return;
        const onDocClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowManual(false);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [showManual]);

    // Clear timer on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current != null) {
                window.clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    const handleCopy = useCallback(async () => {
        const value = text.trim();
        if (!value) return;

        try {
            if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
                setCopied(true);
                if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
                timeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
            } else {
                openManualUI();
            }
        } catch {
            openManualUI();
        }
    }, [text, openManualUI]);

    const handleManualDone = useCallback(() => setShowManual(false), []);

    if (!text || !text.trim()) return null;

    return (
        <div className="relative inline-flex">
            <button
                type="button"
                onClick={handleCopy}
                aria-label={`Copy ${label}`}
                title={copied ? "Copied" : `Copy ${label}`}
                className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted-foreground transition",
                    "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    copied && "bg-muted text-foreground"
                )}
            >
                <Copy className="h-4 w-4" aria-hidden="true"/>
            </button>

            {showManual && (
                <div
                    ref={containerRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Manual copy ${label}`}
                    aria-describedby={instructionsId}
                    className="absolute z-50 mt-2 w-[240px] rounded-md border border-border bg-popover p-2 shadow-lg"
                >
                    <div id={instructionsId} className="text-xs text-muted-foreground mb-1">
                        Press <kbd className="px-1 border rounded">⌘/Ctrl</kbd> +{" "}
                        <kbd className="px-1 border rounded">C</kbd> to copy:
                    </div>
                    <input
                        ref={inputRef}
                        readOnly
                        value={text}
                        autoFocus
                        className="w-full rounded border border-input bg-background px-2 py-1 text-xs"
                        onFocus={(e) => e.currentTarget.select()}
                        onKeyDown={handleManualKeyDown}
                    />
                    <div className="mt-2 flex justify-end">
                        <button
                            type="button"
                            className="text-xs rounded border border-border px-2 py-1 hover:bg-muted"
                            onClick={handleManualDone}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

type CopyableFieldProps = {
    label: string;
    text?: string | null;
    multiline?: boolean;
    emphasize?: boolean;
};

const CopyableField: React.FC<CopyableFieldProps> = (
    {
        label,
        text,
        multiline = false,
        emphasize = false,
    }) => {

    const value = (text ?? "").trim();
    if (!value) return null;

    return (
        <div
            className={cn(
                "rounded-lg border border-border bg-background p-4 shadow-sm",
                emphasize ? "bg-muted/50" : "bg-background"
            )}
        >
            <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-1.5">
          {label}
        </span>
                <CopyButton text={value} label={label}/>
            </div>
            <div className={cn("text-sm text-foreground", multiline && "whitespace-pre-line")}>{value}</div>
        </div>
    );
};

const CopyableLine: React.FC<CopyableFieldProps> = ({ label, text }) => {
    const value = (text ?? "").trim();
    if (!value) return null;

    return (
        <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-1.5">
          {label}
        </span>
                <span className="text-sm text-foreground">{value}</span>
            </div>
            <CopyButton text={value} label={label}/>
        </div>
    );
};

function buildPhotoSrc(path: unknown): string | null {
    if (typeof path !== "string") return null;
    const trimmed = path.trim();
    if (!trimmed) return null;
    const normalized = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    return `/media/${normalized}`;
}

type PresenterFilterKey = "complete" | "missingBio" | "hasTwoSessions";

const PresentersTab: React.FC<PresentersTabProps> = ({ presenters, isLoading, error }) => {
    const sortedPresenters = useMemo(() => {
        return [...presenters].sort((a, b) => {
            const lastA = (a.lastName ?? "").toLocaleLowerCase();
            const lastB = (b.lastName ?? "").toLocaleLowerCase();
            if (lastA !== lastB) return lastA.localeCompare(lastB);
            const firstA = (a.firstName ?? "").toLocaleLowerCase();
            const firstB = (b.firstName ?? "").toLocaleLowerCase();
            return firstA.localeCompare(firstB);
        });
    }, [presenters]);

    const [activeFilter, setActiveFilter] = useState<PresenterFilterKey>("complete");

    const filterCounts = useMemo(() => {
        return sortedPresenters.reduce(
            (acc, presenter) => {
                const hasBio = Boolean(presenter.presenterBio?.trim());
                const hasSecondSessionTitle = Boolean(presenter.session2Title?.trim());
                const hasSecondSessionDescription = Boolean(presenter.session2Description?.trim());
                const hasTwoSessions = hasSecondSessionTitle || hasSecondSessionDescription;

                if (!hasBio) acc.missingBio += 1;
                if (hasTwoSessions) acc.hasTwoSessions += 1;

                return acc;
            },
            { missingBio: 0, hasTwoSessions: 0 }
        );
    }, [sortedPresenters]);

    useEffect(() => {
        if (activeFilter === "missingBio" && filterCounts.missingBio === 0) {
            setActiveFilter("complete");
        } else if (activeFilter === "hasTwoSessions" && filterCounts.hasTwoSessions === 0) {
            setActiveFilter("complete");
        }
    }, [activeFilter, filterCounts]);

    const filteredPresenters = useMemo(() => {
        return sortedPresenters.filter((presenter) => {
            const hasBio = Boolean(presenter.presenterBio?.trim());
            const hasSessionTitle = Boolean(presenter.session1Title?.trim());
            const hasSecondSessionTitle = Boolean(presenter.session2Title?.trim());
            const hasSecondSessionDescription = Boolean(presenter.session2Description?.trim());
            const hasTwoSessions = hasSecondSessionTitle || hasSecondSessionDescription;

            if (activeFilter === "missingBio") {
                return !hasBio;
            }

            if (activeFilter === "hasTwoSessions") {
                return hasTwoSessions;
            }

            return hasBio && hasSessionTitle;
        });
    }, [activeFilter, sortedPresenters]);

    const showLoading = isLoading;
    const showError = Boolean(error);
    const hasStatus = showLoading || showError;
    const noPresentersAvailable = !isLoading && !error && sortedPresenters.length === 0;

    const filterConfigs: Array<{ key: PresenterFilterKey; label: string }> = [
        { key: "missingBio", label: "Missing Bio" },
        { key: "hasTwoSessions", label: "Has Two Sessions" },
    ];

    return (
        <div className="space-y-6">
            {hasStatus && (
                <div className="space-y-2">
                    {showLoading && <div className="text-sm text-muted-foreground">Loading presenters…</div>}
                    {showError && <div className="text-sm text-red-600">Error: {error}</div>}
                </div>
            )}
            <div className="admin-toolbar">
                <div className="admin-toolbar-row admin-toolbar-row--between">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">Filters:</span>
                        {filterConfigs.map(({ key, label }) => {
                            const isActive = activeFilter === key;
                            const count =
                                key === "missingBio"
                                    ? filterCounts.missingBio
                                    : filterCounts.hasTwoSessions;
                            const displayLabel = count > 0 ? `${label} (${count})` : label;
                            return (
                                <Button
                                    key={key}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "admin-filter-pill",
                                        isActive && count > 0
                                            ? "admin-filter-pill--active"
                                            : "admin-filter-pill--inactive",
                                        count === 0 && "admin-filter-pill--disabled"
                                    )}
                                    disabled={count === 0}
                                    onClick={() => {
                                        if (count === 0) return;
                                        setActiveFilter((prev) => (prev === key ? "complete" : key));
                                    }}
                                >
                                    {displayLabel}
                                </Button>
                            );
                        })}
                    </div>
                    <div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="admin-toolbar-btn admin-toolbar-btn--dark"
                            onClick={() => setActiveFilter("complete")}
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </div>

            {noPresentersAvailable ? (
                <div className="text-sm text-muted-foreground">No presenters found.</div>
            ) : filteredPresenters.length === 0 ? (
                <div className="text-sm text-muted-foreground">No presenters match the current filter.</div>
            ) : (
                <div className="space-y-8">
                    {filteredPresenters.map((presenter) => {
                        const fallbackName = presenter.email || `Presenter #${presenter.id}`;
                        const name = formatFullName({
                            namePrefix: presenter.namePrefix,
                            firstName: presenter.firstName,
                            lastName: presenter.lastName,
                            nameSuffix: presenter.nameSuffix,
                            fallback: fallbackName,
                        });
                        const photoSrc = buildPhotoSrc(presenter.presenterPicUrl) ?? presenterPlaceholder;
                        const session2Title = (presenter.session2Title ?? "").trim();
                        const session2Description = (presenter.session2Description ?? "").trim();
                        const hasSecondSession = Boolean(session2Title || session2Description);

                        return (
                            <div key={presenter.id} className="space-y-4">
                                <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                                    <div className="space-y-4">
                                        <CopyableField label="Name" text={name} emphasize/>
                                        <CopyableLine label="Email" text={presenter.email}/>
                                        <CopyableField label="Presenter Bio" text={presenter.presenterBio} multiline emphasize/>
                                        <CopyableField label="Session Title" text={presenter.session1Title} emphasize/>
                                        <CopyableField
                                            label="Session Description"
                                            text={presenter.session1Description}
                                            multiline
                                            emphasize
                                        />
                                        {hasSecondSession && (
                                            <>
                                                <CopyableField label="Session 2 Title" text={session2Title} emphasize/>
                                                <CopyableField
                                                    label="Session 2 Description"
                                                    text={session2Description}
                                                    multiline
                                                    emphasize
                                                />
                                            </>
                                        )}
                                    </div>
                                    <div className="flex justify-end md:justify-start">
                                        <img
                                            src={photoSrc}
                                            alt={name ? `${name} presenter photo` : "Presenter photo"}
                                            className="h-[250px] w-[250px] rounded object-cover md:h-[500px] md:w-[500px]"
                                            width={500}
                                            height={500}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                </div>
                                <hr className="border-border"/>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PresentersTab;
