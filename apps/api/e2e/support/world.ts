// apps/api/e2e/support/world.ts
import { World, setWorldConstructor, IWorldOptions } from '@cucumber/cucumber';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/database/prisma.service';
import supertest from 'supertest';
import { AppModule } from '../../src/app.module';

export class ApiWorld extends World {
  app!: INestApplication;
  prisma!: PrismaService;
  request!: ReturnType<typeof supertest.agent>;

  // Store state between steps within a scenario
  authToken?: string;
  refreshToken?: string;
  response?: supertest.Response;

  constructor(options: IWorldOptions) {
    super(options);
  }

  async init(): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();

    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await this.app.init();

    this.prisma = this.app.get(PrismaService);
    this.request = supertest.agent(
      this.app.getHttpServer() as Parameters<typeof supertest.agent>[0],
    );
  }

  async destroy(): Promise<void> {
    await this.app?.close();
  }
}

setWorldConstructor(ApiWorld);
