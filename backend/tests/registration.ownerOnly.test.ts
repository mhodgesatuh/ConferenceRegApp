import express from 'express';
import request from 'supertest';
import { describe, expect, test, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getRegistrationByEmail: vi.fn(),
    getCredentialByRegId: vi.fn(),
    getRegistrationWithPinById: vi.fn(),
    logDbError: vi.fn(),
}));

vi.mock('@/routes/registration.service', () => ({
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

import router from '@/routes/registration';

describe('ownerOnly registration id', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('allows access with matching string registrationId', async () => {
        mocks.getRegistrationWithPinById.mockResolvedValueOnce([
            {
                registrations: { email: 'user@example.com' },
                credentials: { loginPin: '12345678' },
            },
        ]);
        const app = express();
        app.use((req, _res, next) => {
            (req as any).registrationAuth = { registrationId: '1' };
            next();
        });
        app.use('/', router);
        const res = await request(app).get('/1');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            registration: { email: 'user@example.com', loginPin: '12345678' },
        });
        expect(mocks.getRegistrationWithPinById).toHaveBeenCalledWith(1);
    });

    test('denies access with mismatching registrationId', async () => {
        const app = express();
        app.use((req, _res, next) => {
            (req as any).registrationAuth = { registrationId: '2' };
            next();
        });
        app.use('/', router);
        const res = await request(app).get('/1');
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'Unauthorized', id: 1 });
        expect(mocks.getRegistrationWithPinById).not.toHaveBeenCalled();
    });

    test('denies access when registrationId is non-numeric', async () => {
        const app = express();
        app.use((req, _res, next) => {
            (req as any).registrationAuth = { registrationId: 'abc' };
            next();
        });
        app.use('/', router);
        const res = await request(app).get('/1');
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'Unauthorized', id: 1 });
        expect(mocks.getRegistrationWithPinById).not.toHaveBeenCalled();
    });

    test('denies access when registrationId is missing', async () => {
        const app = express();
        app.use((req, _res, next) => {
            (req as any).registrationAuth = {};
            next();
        });
        app.use('/', router);
        const res = await request(app).get('/1');
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'Unauthorized', id: 1 });
        expect(mocks.getRegistrationWithPinById).not.toHaveBeenCalled();
    });
});

