import express from 'express';
import request from 'supertest';
import { describe, expect, test, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    createRegistration: vi.fn(),
    updateRegistration: vi.fn(),
    getCredentialByRegId: vi.fn(),
    getRegistrationByEmail: vi.fn(),
    getRegistrationWithPinById: vi.fn(),
    getRegistrationWithPinByLogin: vi.fn(),
}));

vi.mock('@/routes/registration.service', () => ({
    createRegistration: (...args: any[]) => mocks.createRegistration(...args),
    getCredentialByRegId: (...args: any[]) => mocks.getCredentialByRegId(...args),
    getRegistrationByEmail: (...args: any[]) => mocks.getRegistrationByEmail(...args),
    getRegistrationWithPinById: (...args: any[]) => mocks.getRegistrationWithPinById(...args),
    getRegistrationWithPinByLogin: (...args: any[]) => mocks.getRegistrationWithPinByLogin(...args),
    updateRegistration: (...args: any[]) => mocks.updateRegistration(...args),
}));

vi.mock('@/middleware/requirePin', () => ({
    requirePin: (_req: any, _res: any, next: any) => next(),
}));

import router from '@/routes/registration';

describe('registration validation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('create requires mandatory fields', async () => {
        const app = express();
        app.use(express.json());
        app.use('/', router);
        const res = await request(app)
            .post('/')
            .send({ email: 'user@example.com' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: 'Missing required information',
            missing: expect.arrayContaining(['lastName', 'question1', 'question2']),
        });
    });

    test('update cannot blank required fields', async () => {
        const app = express();
        app.use(express.json());
        app.use((req, _res, next) => {
            (req as any).registrationAuth = { registrationId: 1 };
            next();
        });
        app.use('/', router);
        const res = await request(app)
            .put('/1')
            .send({ lastName: '' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: 'Missing required information',
            missing: ['lastName'],
        });
        expect(mocks.updateRegistration).not.toHaveBeenCalled();
    });

    test('create rejects invalid phone numbers', async () => {
        const app = express();
        app.use(express.json());
        app.use('/', router);
        const res = await request(app)
            .post('/')
            .send({
                email: 'user@example.com',
                lastName: 'X',
                question1: 'a',
                question2: 'b',
                phone1: '123',
                phone2: 'abc',
            });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: 'Invalid phone number(s)',
            phone1: '123',
            phone2: 'abc',
        });
    });

    test('update rejects invalid phone numbers', async () => {
        const app = express();
        app.use(express.json());
        app.use((req, _res, next) => {
            (req as any).registrationAuth = { registrationId: 1 };
            next();
        });
        app.use('/', router);
        const res = await request(app)
            .put('/1')
            .send({ phone1: '123' });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            error: 'Invalid phone number(s)',
            phone1: '123',
            phone2: undefined,
        });
        expect(mocks.updateRegistration).not.toHaveBeenCalled();
    });
});

