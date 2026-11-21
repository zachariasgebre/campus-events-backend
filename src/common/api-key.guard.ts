import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expected = this.config.get<string>('CLASSROOM_API_KEY');
    const supplied = request.header('x-api-key');

    // Reject if the server is misconfigured as well as when the supplied key is wrong.
    if (!expected?.trim() || supplied !== expected) {
      throw new UnauthorizedException('A valid x-api-key is required');
    }
    return true;
  }
}
