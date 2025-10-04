import type {Readable} from "stream";

declare global {
    namespace Express {
        namespace Multer {
            interface File {
                fieldname: string;
                originalname: string;
                encoding: string;
                mimetype: string;
                size: number;
                buffer: Buffer;
                destination: string;
                filename: string;
                path: string;
                stream: Readable;
            }
        }

        interface Request {
            file?: Multer.File;
        }
    }
}

export {};
