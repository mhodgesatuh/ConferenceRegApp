import type {IncomingMessage} from "http";

declare module "formidable" {
    interface FormidableFile {
        filepath: string;
        mimetype?: string;
        originalFilename?: string;
    }

    type Fields = Record<string, unknown>;
    type FormidableFiles = Record<string, FormidableFile | FormidableFile[]>;

    interface Options {
        multiples?: boolean;
        maxFileSize?: number;
        keepExtensions?: boolean;
        allowEmptyFiles?: boolean;
    }

    interface FormidableErrorBase extends Error {
        code?: string;
    }

    interface FormidableInstance {
        parse(
            req: IncomingMessage,
            callback: (err: FormidableErrorBase | null, fields: Fields, files: FormidableFiles) => void,
        ): void;
    }

    function formidable(options?: Options): FormidableInstance;

    export = formidable;
    export type File = FormidableFile;
    export type Files = FormidableFiles;
    export type FormidableError = FormidableErrorBase;
}

export {};
