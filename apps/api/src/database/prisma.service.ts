import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

// Type for any Prisma model delegate that has a deleteMany method
type ModelDelegate = {
  deleteMany: () => Promise<unknown>;
};

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

    const modelNames = Object.keys(this).filter(
      (key) =>
        !key.startsWith('_') &&
        !key.startsWith('$') &&
        key !== 'constructor' &&
        // eslint-disable-next-line security/detect-object-injection
        typeof (this as Record<string, unknown>)[key] === 'object',
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

    await Promise.all(
      modelNames.map((modelName) => {
        const model = (this as Record<string, unknown>)[modelName as string];
        if (
          model !== null &&
          typeof model === 'object' &&
          'deleteMany' in model
        ) {
          return (model as ModelDelegate).deleteMany();
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
    this.$on('query' as never, (e: Prisma.QueryEvent) => {
      this.logger.debug(`Query: ${e.query}`);
      this.logger.debug(`Duration: ${e.duration}ms`);
    });
  }
}
