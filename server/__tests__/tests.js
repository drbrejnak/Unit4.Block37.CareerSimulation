const request = require('supertest');
const app = require('../app.js');

describe("Api Enpoints", () => {
    it('Should register a user', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: "testuser",
            password: "testpassword",
        });
        expect(res.statusCode).toEqual(200);
    });
    it('Should login a user', async () => {
        const res = await request(app).post('/api/auth/login').send({
            username: "testuser",
            password: "testpassword",
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
});