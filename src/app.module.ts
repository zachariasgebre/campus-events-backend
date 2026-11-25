import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { EventsModule } from './events/events.module';
import { LoggerMiddleware } from './common/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        for (const name of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
          const secret = config[name];
          if (typeof secret !== 'string' || secret.length < 32 || secret.startsWith('replace-with-')) {
            throw new Error(`${name} must be set to a distinct random secret of at least 32 characters`);
          }
        }
        if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
          throw new Error('JWT access and refresh secrets must be different');
        }
        return config;
      },
    }),
    AuthModule,
    EventsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
