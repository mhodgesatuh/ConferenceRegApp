import express from 'express';
import request from 'supertest';
import { describe, expect, test, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getRegistrationByEmail: vi.fn(),
    getCredentialByRegId: vi.fn(),
    getRegistrationWithPinById: vi.fn(),
    logDbError: vi.fn(),
}));

vi.mock('./registration.service', () => ({
    createRegistration: vi.fn(),
    getCredentialByRegId: (...args: any[]) => mocks.getCredentialByRegId(...args),
    getRegistrationByEmail: (...args: any[]) => mocks.getRegistrationByEmail(...args),
    getRegistrationWithPinById: (...args: any[]) => mocks.getRegistrationWithPinById(...args),
    getRegistrationWithPinByLogin: vi.fn(),
    updateRegistration: vi.fn(),
}));

vi.mock('@/middleware/requirePin', () => ({
    requirePin: (_req: any, _res: any, next: any) => next(),
}));

vi.mock('@/utils/email', () => ({
    sendEmail: vi.fn(),
}));

vi.mock('@/utils/dbErrorLogger', () => ({
    logDbError: (...args: any[]) => mocks.logDbError(...args),
}));

import router from './registration';

describe('registration error handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('lost pin hides internal error details', async () => {
        mocks.getRegistrationByEmail.mockRejectedValue(new Error('db fail'));
        const app = express();
        app.use('/', router);
        const res = await request(app).get('/lost-pin?email=test@example.com');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to send pin' });
        expect(res.body).not.toHaveProperty('cause');
        expect(res.body).not.toHaveProperty('stack');
        expect(mocks.logDbError).toHaveBeenCalled();
    });

    test('fetch by id hides internal error details', async () => {
        mocks.getRegistrationWithPinById.mockRejectedValue(new Error('db fail'));
        const app = express();
        app.use((req, _res, next) => {
            (req as any).registrationAuth = { registrationId: 1 };
            next();
        });
        app.use('/', router);
        const res = await request(app).get('/1');
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: 'Failed to fetch registration' });
        expect(res.body).not.toHaveProperty('cause');
        expect(res.body).not.toHaveProperty('stack');
        expect(mocks.logDbError).toHaveBeenCalled();
    });
});
