// dbErrors.ts

type AnyErr = Record<string, any> | undefined | null;

function unwrap(err: AnyErr): AnyErr {
    const e = err && typeof err === "object" ? err : undefined;
    return (e?.cause && typeof e.cause === "object") ? e.cause : e; // drizzle often nests in cause
}

export function dbErrorDetails(err: unknown) {
    const e = unwrap(err as AnyErr) as AnyErr;
    return {
        mysqlCode: e?.code,       // e.g. 'ER_DUP_ENTRY'
        mysqlErrno: e?.errno,     // e.g. 1062
        sqlState: e?.sqlState,    // e.g. '23000'
        sqlMessage: e?.sqlMessage || e?.message,
        sql: e?.sql,              // raw SQL (no params)
        fatal: e?.fatal === true,
    };
}

export function isDuplicateKey(err: unknown) {
    const d = dbErrorDetails(err);
    return d.mysqlCode === "ER_DUP_ENTRY" || d.mysqlErrno === 1062;
}
