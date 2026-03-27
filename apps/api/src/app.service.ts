import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

interface HealthResponse {
  status: string;
  timestamp: string;
  database: string;
  environment: string;
}

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthResponse> {
    let dbStatus = 'disconnected';

    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1 as result`;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
      console.log(error);
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
