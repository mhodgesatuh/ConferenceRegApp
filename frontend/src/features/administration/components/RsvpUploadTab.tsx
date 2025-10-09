// frontend/src/features/administration/components/RsvpUploadTab.tsx

import React, { useCallback, useMemo, useState } from "react";

import { Button, Input, Label, Message } from "@/components/ui";
import { apiFetch } from "@/lib/api";

type UploadIssue = { row: number; problems: string[] };

type EmailSummary = {
    attempted: number;
    sent: number;
    logged: number;
    failures?: { email: string; error: string }[];
};

type RsvpActionResponse = {
    processed: number;
    email: EmailSummary;
};

const EmailSummaryDetails: React.FC<{ summary: EmailSummary }> = ({ summary }) => (
    <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p>
            Emails attempted: <span className="font-medium text-foreground">{summary.attempted}</span>
        </p>
        <p>
            Sent via SMTP: <span className="font-medium text-foreground">{summary.sent}</span>
        </p>
        <p>
            Logged only: <span className="font-medium text-foreground">{summary.logged}</span>
        </p>
    </div>
);

const ROLE_DESCRIPTIONS: Record<string, string> = {
    "": "Attendee only",
    A: "Attendee & organizer",
    P: "Attendee & presenter",
    AP: "Attendee, presenter & organizer",
};

const RsvpUploadTab: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<RsvpActionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [issues, setIssues] = useState<UploadIssue[] | null>(null);
    const [uploadWarnings, setUploadWarnings] = useState<{ email: string; error: string }[] | null>(null);
    const [reminding, setReminding] = useState(false);
    const [reminderResult, setReminderResult] = useState<RsvpActionResponse | null>(null);
    const [reminderError, setReminderError] = useState<string | null>(null);
    const [reminderWarnings, setReminderWarnings] = useState<{ email: string; error: string }[] | null>(null);

    const roleSummary = useMemo(
        () =>
            Object.entries(ROLE_DESCRIPTIONS).map(([code, description]) => ({ code: code || "(blank)", description })),
        []
    );

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFile = event.currentTarget.files?.[0] ?? null;
        setFile(nextFile);
    }, []);

    const handleSubmit = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (!file) {
                setError("Please choose a CSV file to upload.");
                return;
            }

            const formData = new FormData();
            formData.append("file", file);

            setUploading(true);
            setError(null);
            setIssues(null);
            setResult(null);
            setUploadWarnings(null);

            try {
                const response = await apiFetch("/api/rsvp/upload", { method: "POST", body: formData });
                const payload = response as RsvpActionResponse;
                setResult(payload);
                setUploadWarnings(
                    payload.email.failures && payload.email.failures.length > 0 ? payload.email.failures : null
                );
            } catch (err) {
                const defaultMessage = "Upload failed. Please try again.";
                if (err && typeof err === "object" && "data" in err && err.data) {
                    const data = err.data as Record<string, unknown>;
                    const message = typeof data.error === "string" ? data.error : defaultMessage;
                    setError(message);
                    if (Array.isArray(data.issues)) {
                        const parsed = data.issues
                            .filter((issue): issue is { row: unknown; problems: unknown } =>
                                issue && typeof issue === "object"
                            )
                            .map((issue) => {
                                const row = typeof issue.row === "number" ? issue.row : Number(issue.row);
                                const problems = Array.isArray((issue as any).problems)
                                    ? (issue as any).problems.filter((p: unknown): p is string => typeof p === "string")
                                    : [];
                                return { row, problems } as UploadIssue;
                            })
                            .filter((item) => Number.isFinite(item.row) && item.problems.length > 0);
                        setIssues(parsed.length > 0 ? parsed : null);
                    }
                } else {
                    setError(defaultMessage);
                }
            } finally {
                setUploading(false);
            }
        },
        [file]
    );

    const handleSendReminders = useCallback(async () => {
        setReminding(true);
        setReminderError(null);
        setReminderResult(null);
        setReminderWarnings(null);

        try {
            const response = await apiFetch("/api/rsvp/remind", { method: "POST" });
            const payload = response as RsvpActionResponse;
            setReminderResult(payload);
            setReminderWarnings(
                payload.email.failures && payload.email.failures.length > 0 ? payload.email.failures : null
            );
        } catch (err) {
            const defaultMessage = "Unable to send reminders. Please try again.";
            if (err && typeof err === "object" && "data" in err && err.data) {
                const data = err.data as Record<string, unknown>;
                const message = typeof data.error === "string" ? data.error : defaultMessage;
                setReminderError(message);
            } else {
                setReminderError(defaultMessage);
            }
        } finally {
            setReminding(false);
        }
    }, []);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                    Upload a CSV file with three columns in the order <strong>email</strong>, <strong>name</strong>, and
                    <strong> roles</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                    Accepted role values are blank, A, P, or AP. The first row will be ignored when it looks like a header.
                </p>
                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">Role designations</div>
                    <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                        {roleSummary.map(({ code, description }) => (
                            <li key={code}>
                                <span className="font-semibold text-foreground">{code}:</span> {description}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {error && <Message text={error} isError id="rsvp-upload-error" />}

            {issues && (
                <div className="space-y-2" role="alert" aria-live="assertive">
                    <div className="text-sm font-semibold text-red-700">Rows with validation problems</div>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
                        {issues.map((issue) => (
                            <li key={issue.row}>
                                Row {issue.row}: {issue.problems.join(", ")}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {result && (
                <div className="space-y-3">
                    <Message
                        text={`Processed ${result.processed} invitation${result.processed === 1 ? "" : "s"}.`}
                        id="rsvp-upload-success"
                    />
                    <EmailSummaryDetails summary={result.email} />
                    {uploadWarnings && uploadWarnings.length > 0 && (
                        <div className="space-y-1">
                            <div className="text-sm font-semibold text-amber-700">Email delivery issues</div>
                            <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700">
                                {uploadWarnings.map((warning, idx) => (
                                    <li key={`${warning.email}-${idx}`}>
                                        {warning.email}: {warning.error}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="space-y-2">
                    <Label htmlFor="rsvp-upload-file">CSV file</Label>
                    <Input
                        id="rsvp-upload-file"
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    <p className="text-xs text-muted-foreground">
                        Files larger than 2&nbsp;MB are rejected. Rows missing an email or name will cause the entire upload to
                        fail.
                    </p>
                </div>
                <div>
                    <Button type="submit" disabled={!file || uploading}>
                        {uploading ? "Uploading…" : "Upload CSV"}
                    </Button>
                </div>
            </form>

            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Send reminder emails to invitees who have not responded to their RSVP.
                </p>
                <div>
                    <Button type="button" onClick={handleSendReminders} disabled={reminding}>
                        {reminding ? "Sending…" : "Send RSVP Reminders"}
                    </Button>
                </div>
                {reminderError && <Message text={reminderError} isError id="rsvp-reminder-error" />}
                {reminderResult && (
                    <div className="space-y-3">
                        <Message
                            text={
                                reminderResult.processed === 0
                                    ? "No pending RSVPs were found."
                                    : `Sent reminder${reminderResult.processed === 1 ? "" : "s"} to ${reminderResult.processed} registration${reminderResult.processed === 1 ? "" : "s"}.`
                            }
                            id="rsvp-reminder-success"
                        />
                        <EmailSummaryDetails summary={reminderResult.email} />
                        {reminderWarnings && reminderWarnings.length > 0 && (
                            <div className="space-y-1">
                                <div className="text-sm font-semibold text-amber-700">Reminder delivery issues</div>
                                <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700">
                                    {reminderWarnings.map((warning, idx) => (
                                        <li key={`${warning.email}-${idx}`}>
                                            {warning.email}: {warning.error}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RsvpUploadTab;
