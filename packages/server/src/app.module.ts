import { BadRequestException, ClassSerializerInterceptor, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscribeModule } from './modules/subscribe/subscribe.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { SeriesModule } from './modules/series/series.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ApplicationExceptionFilter } from './utils/application.exception.filter';
import { FileModule } from './modules/file/file.module';
import { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-store';
import { buildException } from './utils/build-exception.util';
import { ErrorCodeEnum } from './enums/error-code.enum';
import { Aria2Module } from './modules/aria2/aria2.module';
import { LiveModule } from './modules/live/live.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
    }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync<RedisClientOptions>({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        store: redisStore as any,
        url: `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
        database: Number(configService.get('REDIS_DB')),
        password: configService.get('REDIS_PASSWORD'),
        ttl: 24 * 60 * 60 * 1000,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: Number(configService.get('DB_PORT')),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        timezone: 'Z',
        entities: ['dist/**/*.entity{.ts,.js}'],
        migrations: ['dist/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations_minaplay',
        migrationsRun: true,
        cli: {
          migrationsDir: 'src/migrations',
        },
      }),
    }),
    Aria2Module.registerAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        rpcUrl: configService.get('ARIA2_RPC_URL'),
        rpcSecret: configService.get('ARIA2_RPC_SECRET'),
        autoUpdateTracker: Number(configService.get('ARIA2_AUTO_UPDATE_TRACKER')) === 1,
        trackerListUrl: configService.get('ARIA2_TRACKER_LIST_URL'),
        expireHours: Number(configService.get('ARIA2_EXPIRE_HOURS')) || 0,
      }),
    }),
    LiveModule.registerAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        mediasoupWorkerNum: Number(configService.get('MS_WORKERS_NUM')),
        mediasoupAudioClockRate: Number(configService.get('MS_AUDIO_CLOCK_RATE')),
        mediasoupAudioChannel: Number(configService.get('MS_AUDIO_CHANNELS')),
        mediasoupMaxIncomeBitrate: Number(configService.get('MS_AUDIO_MAX_INCOME_BITRATE')),
      }),
    }),
    FileModule,
    SubscribeModule,
    AuthorizationModule,
    SeriesModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          errorHttpStatusCode: 400,
          exceptionFactory: () => buildException(BadRequestException, ErrorCodeEnum.BAD_REQUEST, 'BAD REQUEST'),
        }),
    },
    {
      provide: APP_FILTER,
      useClass: ApplicationExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
