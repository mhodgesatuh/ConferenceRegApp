// backend/src/utils/dbErrors.ts

type AnyErr = Record<string, unknown> | undefined | null;

function unwrap(err: AnyErr): Record<string, unknown> | undefined {
    const e = err && typeof err === "object" ? err : undefined;
    return e && typeof (e as any).cause === "object" ? ((e as any).cause as Record<string, unknown>) : e;
}

export interface DbErrorDetails {
    mysqlCode?: string;
    mysqlErrno?: number;
    sqlState?: string;
    sqlMessage?: string;
    sql?: string;
    fatal: boolean;
}

export function dbErrorDetails(err: unknown): DbErrorDetails {
    const e = unwrap(err as AnyErr) as any;
    return {
        mysqlCode: e?.code,
        mysqlErrno: e?.errno,
        sqlState: e?.sqlState,
        sqlMessage: e?.sqlMessage ?? e?.message,
        sql: e?.sql,
        fatal: e?.fatal === true,
    };
}

export function isDuplicateKey(err: unknown): boolean {
    const d = dbErrorDetails(err);
    return d.mysqlCode === "ER_DUP_ENTRY" || d.mysqlErrno === 1062;
}
