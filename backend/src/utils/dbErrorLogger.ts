// backend/src/utils/dbErrorLogger.ts

import {dbErrorDetails} from "./dbErrors";

/**
 * Log a database-related error with standardized fields.
 * Extracts MySQL codes and stack traces so that callers emit
 * consistent error logs across the application.
 */
export function logDbError(
    log: { error: (message: string, details: Record<string, unknown>) => void },
    err: unknown,
    context: Record<string, unknown> = {}
): void {
    const db = dbErrorDetails(err);
    const message = typeof context.message === "string" ? context.message : "DB operation failed";
    log.error(message, {
        ...context,
        mysqlCode: db.mysqlCode,
        mysqlErrno: db.mysqlErrno,
        sqlState: db.sqlState,
        sqlMessage: db.sqlMessage,
        sql: db.sql, // toggle or redact in prod if needed
        stack: err instanceof Error ? err.stack : undefined,
    });
}
