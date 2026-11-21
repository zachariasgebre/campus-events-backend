import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const url = request.originalUrl;
    const startedAt = Date.now();
    console.log(`Request started: ${url}`);

    return next.handle().pipe(
      tap({
        complete: () => console.log(`Request completed in ${Date.now() - startedAt}ms: ${url}`),
        error: () => console.log(`Request failed after ${Date.now() - startedAt}ms: ${url}`),
      }),
    );
  }
}
