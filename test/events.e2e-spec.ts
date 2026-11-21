import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Campus Events API (e2e)', () => {
  let app: INestApplication;
  let configuredApiKey: string | undefined;

  beforeAll(async () => {
    configuredApiKey = 'e2e-test-key';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ConfigService)
      .useValue({ get: (key: string) => (key === 'CLASSROOM_API_KEY' ? configuredApiKey : undefined) })
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists seeded events with pagination metadata', async () => {
    const response = await request(app.getHttpServer()).get('/api/events').expect(200);
    expect(response.body.items).toHaveLength(10);
    expect(response.body.total).toBe(10);
    expect(response.body.page).toBe(1);
  });

  it('filters by category and publication status', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/events?category=Workshop&isPublished=true')
      .expect(200);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items.every((event: any) => event.category === 'Workshop' && event.isPublished)).toBe(true);
  });

  it('returns 404 for a missing event', async () => {
    await request(app.getHttpServer()).get('/api/events/9999').expect(404);
  });

  it('creates a valid event with the API key', async () => {
    await request(app.getHttpServer())
      .post('/api/events')
      .set('x-api-key', 'e2e-test-key')
      .send({ title: 'Test event', description: 'A test event.', location: 'Campus', eventDate: '2030-06-15T10:00:00.000Z', category: 'Test', isPublished: true })
      .expect(201)
      .expect(({ body }) => expect(body.id).toBe(11));
  });

  it('rejects an invalid event body', async () => {
    await request(app.getHttpServer())
      .post('/api/events')
      .set('x-api-key', 'e2e-test-key')
      .send({ title: '', unexpected: true })
      .expect(400);
  });

  it('rejects a missing or wrong API key', async () => {
    await request(app.getHttpServer()).post('/api/events').send({}).expect(401);
    await request(app.getHttpServer()).post('/api/events').set('x-api-key', 'wrong').send({}).expect(401);
  });

  it('rejects event creation when the configured server key is unset', async () => {
    configuredApiKey = undefined;
    await request(app.getHttpServer())
      .post('/api/events')
      .set('x-api-key', 'e2e-test-key')
      .send({})
      .expect(401);
    configuredApiKey = 'e2e-test-key';
  });

  it('returns 400 when an id is not an integer', async () => {
    await request(app.getHttpServer()).get('/api/events/nope').expect(400);
  });

  it('returns 400 when pagination values are invalid', async () => {
    await request(app.getHttpServer()).get('/api/events?page=hello').expect(400);
    await request(app.getHttpServer()).get('/api/events?limit=0').expect(400);
  });

  it('returns upcoming events before the dynamic id route can match', async () => {
    const response = await request(app.getHttpServer()).get('/api/events/upcoming').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('returns sessions for an existing event and 404 for a missing event', async () => {
    const response = await request(app.getHttpServer()).get('/api/events/2/sessions').expect(200);
    expect(response.body).toHaveLength(2);
    await request(app.getHttpServer()).get('/api/events/9999/sessions').expect(404);
  });
});
