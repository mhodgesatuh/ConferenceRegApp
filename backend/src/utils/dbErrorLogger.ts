// backend/src/utils/dbErrorLogger.ts

import { dbErrorDetails } from "./dbErrors";

export function logDbError(log: {
        error: (arg0: any, arg1: {
            mysqlCode: any; mysqlErrno: any; sqlState: any; sqlMessage: any; sql: any; // toggle or redact in prod if needed
            stack: string | undefined;
        }) => void;
    }, err: unknown, context: Record<string, any> = {}) {
    const db = dbErrorDetails(err);
    log.error(context.message ?? "DB operation failed", {
        ...context,
        mysqlCode: db.mysqlCode,
        mysqlErrno: db.mysqlErrno,
        sqlState: db.sqlState,
        sqlMessage: db.sqlMessage,
        sql: db.sql,           // toggle or redact in prod if needed
        stack: err instanceof Error ? err.stack : undefined,
    });
}
