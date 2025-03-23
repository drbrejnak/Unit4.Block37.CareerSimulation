const request = require('supertest');
const app = require('../app.js');

let authToken;

beforeAll(async () => {
    const authResponse = await request(app).post('/api/auth/login').send({
        username: "moe",
        password: "m_pw",
    });
    authToken = authResponse.body.token;
});

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
            username: "curly",
            password: "c_pw",
        });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });
    it("Should return a logged-in user", async () => {
      const res = await request(app).get("/api/auth/me").set(
        'Authorization', `${authToken}`
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body.username).toBe('moe');
    });
});
