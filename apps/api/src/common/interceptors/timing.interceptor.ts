import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const { method, url } = req;
        this.logger.debug(`${method} ${url} — ${duration}ms`);

        // Warn if any endpoint exceeds 500ms locally
        if (duration > 500) {
          this.logger.warn(`SLOW REQUEST: ${method} ${url} took ${duration}ms`);
        }
      }),
    );
  }
}
