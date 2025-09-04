// backend/tests/csrf.spec.ts

import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '@/app';

const ORIGIN = process.env.UI_ORIGIN || 'https://localhost:8080';
const SEAL = process.env.INTERNAL_SECRET || 'test-secret';

describe('CSRF flow', () => {
    let cookies: string[] = [];
    let regId = 0;
    let csrf = '';
    let loginPin = '';

    it('CREATE: allows POST /api/registrations without csrf (seal + origin required)', async () => {
        const res = await request(app)
            .post('/api/registrations')
            .set('x-internal-secret', SEAL)
            .set('Origin', ORIGIN)
            .send({ email: 'a@b.com', lastName: 'Doe', question1: 'x', question2: 'y' });

        expect(res.status).toBe(201);
        regId = res.body.id;
        loginPin = res.body.loginPin;
        expect(loginPin).toBeDefined();
    });

    it('LOGIN: sets cookie and returns csrf', async () => {
        const res = await request(app)
            .post('/api/registrations/login')
            .set('x-internal-secret', SEAL)
            .send({ email: 'a@b.com', pin: loginPin });

        expect(res.status).toBe(200);
        csrf = res.body.csrf;
        cookies = (res.headers['set-cookie'] || []) as string[];
        expect(csrf).toBeTruthy();
        expect(cookies.join(';')).toContain('sessionid=');
    });

    it('PUT without cookie -> 401', async () => {
        const res = await request(app)
            .put(`/api/registrations/${regId}`)
            .set('x-internal-secret', SEAL)
            .set('Origin', ORIGIN)
            .set('X-CSRF-Token', csrf)
            .send({ phone1: '808-555-1212' });

        expect(res.status).toBe(401);
    });

    it('PUT with cookie but missing csrf -> 403', async () => {
        const res = await request(app)
            .put(`/api/registrations/${regId}`)
            .set('x-internal-secret', SEAL)
            .set('Origin', ORIGIN)
            .set('Cookie', cookies)
            .send({ phone1: '808-555-1212' });

        expect(res.status).toBe(403);
    });

    it('PUT with cookie + csrf + good origin -> 200', async () => {
        const res = await request(app)
            .put(`/api/registrations/${regId}`)
            .set('x-internal-secret', SEAL)
            .set('Origin', ORIGIN)
            .set('Cookie', cookies)
            .set('X-CSRF-Token', csrf)
            .send({ phone1: '808-555-1212' });

        expect(res.status).toBe(200);
        expect(res.body?.registration?.phone1).toBe('808-555-1212');
    });
});
