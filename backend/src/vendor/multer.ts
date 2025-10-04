import type {Request, RequestHandler} from "express";
import formidable, { type File as FormidableFile, type Files as FormidableFiles, type FormidableError } from "formidable";
import { Readable } from "stream";
import fs from "fs/promises";

export type FileFilterCallback = (error: unknown, acceptFile?: boolean) => void;

export class MulterError extends Error {
    public readonly code: string;

    constructor(code: string, message?: string) {
        super(message);
        this.name = "MulterError";
        this.code = code;
    }
}

export type StorageEngine = Record<string, unknown>;

export interface MulterOptions {
    storage?: StorageEngine;
    limits?: {
        fileSize?: number;
    };
    fileFilter?: (
        req: Request,
        file: Express.Multer.File,
        cb: FileFilterCallback,
    ) => void;
}

interface ParsedFile extends Pick<FormidableFile, "filepath" | "mimetype" | "originalFilename"> {}

function normalizeFile(input?: FormidableFile | FormidableFile[] | null): ParsedFile | undefined {
    if (!input) return undefined;
    const value = Array.isArray(input) ? input[0] : input;
    if (!value) return undefined;
    return {
        filepath: value.filepath,
        mimetype: value.mimetype ?? undefined,
        originalFilename: value.originalFilename ?? undefined,
    };
}

async function readFileBuffer(file: ParsedFile): Promise<Buffer> {
    const buffer = await fs.readFile(file.filepath);
    await fs.unlink(file.filepath).catch(() => {});
    return buffer;
}

function toMulterFile(field: string, parsed: ParsedFile, buffer: Buffer): Express.Multer.File {
    return {
        fieldname: field,
        originalname: parsed.originalFilename ?? "",
        encoding: "7bit",
        mimetype: parsed.mimetype ?? "application/octet-stream",
        size: buffer.length,
        buffer,
        destination: "",
        filename: "",
        path: "",
        stream: Readable.from(buffer),
    } as Express.Multer.File;
}

function createErrorFromFormidable(err: unknown): Error {
    if (err instanceof Error) {
        if ((err as any).code === "LIMIT_FILE_SIZE" || /maxFileSize exceeded/i.test(err.message)) {
            return new MulterError("LIMIT_FILE_SIZE", err.message);
        }
        return err;
    }
    return new Error("Unexpected upload error");
}

function multer(options: MulterOptions = {}) {
    const { limits, fileFilter } = options;

    return {
        single(fieldName: string): RequestHandler {
            return (req, res, next) => {
                const form = formidable({
                    multiples: false,
                    maxFileSize: limits?.fileSize,
                    keepExtensions: false,
                    allowEmptyFiles: false,
                });

                form.parse(req, async (err: FormidableError | null, _fields: Record<string, unknown>, files: FormidableFiles) => {
                    if (err) {
                        next(createErrorFromFormidable(err));
                        return;
                    }

                    const parsed = normalizeFile(files[fieldName]);

                    if (!parsed) {
                        (req as any).file = undefined;
                        next();
                        return;
                    }

                    try {
                        const buffer = await readFileBuffer(parsed);
                        const multerFile = toMulterFile(fieldName, parsed, buffer);

                        if (fileFilter) {
                            try {
                                fileFilter(req, multerFile, (filterErr, accept) => {
                                    if (filterErr) {
                                        next(filterErr);
                                        return;
                                    }
                                    if (accept === false) {
                                        (req as any).file = undefined;
                                        next();
                                        return;
                                    }
                                    (req as any).file = multerFile;
                                    next();
                                });
                            } catch (filterErr) {
                                next(filterErr);
                            }
                        } else {
                            (req as any).file = multerFile;
                            next();
                        }
                    } catch (readErr) {
                        next(readErr);
                    }
                });
            };
        },
    };
}

multer.memoryStorage = function memoryStorage(): StorageEngine {
    return {};
};

(multer as any).MulterError = MulterError;

export default multer;
