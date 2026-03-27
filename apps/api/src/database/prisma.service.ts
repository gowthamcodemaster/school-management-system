import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('✅ Database connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('❌ Database disconnected');
  }

  /**
   * Clean all data from database (useful for testing)
   * WARNING: Only works in development/test environments
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production!');
    }

    // Get all model names from Prisma
    const modelNames = Object.keys(this).filter(
      (key) =>
        !key.startsWith('_') &&
        !key.startsWith('$') &&
        key !== 'constructor' &&
        typeof key === 'object',
    ) as Array<
      keyof Omit<
        this,
        | '$connect'
        | '$disconnect'
        | '$on'
        | '$transaction'
        | '$use'
        | '$executeRaw'
        | '$executeRawUnsafe'
        | '$queryRaw'
        | '$queryRawUnsafe'
      >
    >;

    // Delete all records from each model
    await Promise.all(
      modelNames.map((modelName) => {
        const model = this[modelName];
        if (model && typeof model === 'object' && 'deleteMany' in model) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          return (model as any).deleteMany();
        }
        return Promise.resolve();
      }),
    );

    this.logger.log('🧹 Database cleaned successfully');
  }

  /**
   * Enable query logging
   */
  enableQueryLogging(): void {
    this.$on('query' as never, (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.debug(`Query: ${e.query}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.debug(`Duration: ${e.duration}ms`);
    });
  }
}
