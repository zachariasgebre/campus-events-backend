import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { AppModule } from '../src/app.module';

describe('Campus Events API with JWT authentication (e2e)', () => {
  let app: INestApplication;
  const api = () => request(app.getHttpServer());
  const email = `student-${Date.now()}@example.edu`;
  const password = 'CorrectHorse7!';
  let accessToken: string;
  let refreshToken: string;
  let rotatedRefreshToken: string;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'e2e-access-secret-that-is-long-and-unique';
    process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret-that-is-different-and-long';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  it('registers a user and returns only safe fields', async () => {
    const response = await api().post('/api/auth/register').send({ email, password }).expect(201);
    expect(response.body).toMatchObject({ id: 1, email, roles: ['student'] });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('refreshHash');
  });

  it('returns 409 when an email is registered twice', async () => {
    await api().post('/api/auth/register').send({ email, password }).expect(409);
  });

  it('rejects invalid registration values and client-supplied roles', async () => {
    await api().post('/api/auth/register').send({ email: 'bad', password: 'short' }).expect(400);
    await api().post('/api/auth/register').send({ email: 'admin@example.edu', password, roles: ['admin'] }).expect(400);
  });

  it('allows public login without an access token and returns a token pair', async () => {
    const response = await api().post('/api/auth/login').send({ email, password }).expect(200);
    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;
    expect(accessToken).toEqual(expect.any(String));
    expect(refreshToken).toEqual(expect.any(String));
  });

  it('uses the same generic 401 for a wrong password and unknown email', async () => {
    const wrongPassword = await api().post('/api/auth/login').send({ email, password: 'WrongPassword7!' }).expect(401);
    const unknownEmail = await api().post('/api/auth/login').send({ email: 'missing@example.edu', password }).expect(401);
    expect(unknownEmail.body.message).toEqual(wrongPassword.body.message);
  });

  it('rejects /me without a token and accepts a valid bearer token', async () => {
    await api().get('/api/auth/me').expect(401);
    const response = await api().get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(response.body).toMatchObject({ id: 1, email, roles: ['student'] });
  });

  it('rejects tampered and expired bearer tokens', async () => {
    const tampered = `${accessToken.slice(0, -1)}x`;
    await api().get('/api/auth/me').set('Authorization', `Bearer ${tampered}`).expect(401);
    const expired = await app.get(JwtService).signAsync(
      { sub: 1, email, roles: ['student'] },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '-1s', algorithm: 'HS256' },
    );
    await api().get('/api/auth/me').set('Authorization', `Bearer ${expired}`).expect(401);
  });

  it('protects event routes with the global guard', async () => {
    await api().get('/api/events').expect(401);
    await api().get('/api/events').set('Authorization', `Bearer ${accessToken}`).expect(200);
  });

  it('rotates refresh tokens and rejects reuse of the old token', async () => {
    const response = await api().post('/api/auth/refresh').send({ refreshToken }).expect(200);
    rotatedRefreshToken = response.body.refreshToken;
    accessToken = response.body.accessToken;
    expect(rotatedRefreshToken).not.toBe(refreshToken);
    await api().post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('rejects an invalid refresh token', async () => {
    await api().post('/api/auth/refresh').send({ refreshToken: 'not-a-jwt' }).expect(401);
  });

  it('requires access authentication for logout and invalidates refresh after logout', async () => {
    await api().post('/api/auth/logout').expect(401);
    await api().post('/api/auth/logout').set('Authorization', `Bearer ${accessToken}`).expect(200);
    await api().post('/api/auth/refresh').send({ refreshToken: rotatedRefreshToken }).expect(401);
  });
});
