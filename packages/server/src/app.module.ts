import { BadRequestException, ClassSerializerInterceptor, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { FileModule } from './modules/file/file.module';
import { RedisClientOptions } from 'redis';
import { redisStore } from 'cache-manager-redis-yet';
import { buildException } from './utils/build-exception.util';
import { ErrorCodeEnum } from './enums/error-code.enum';
import { Aria2Module } from './modules/aria2/aria2.module';
import { LiveModule } from './modules/live/live.module';
import { cpus } from 'os';
import { UserModule } from './modules/user/user.module';
import { SeriesModule } from './modules/series/series.module';
import { MediaModule } from './modules/media/media.module';
import { SubscribeModule } from './modules/subscribe/subscribe.module';
import { SystemModule } from './modules/system/system.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PluginModule } from './modules/plugin/plugin.module';
import { ApplicationExceptionFilter } from './common/application.exception.filter';

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
        store: redisStore,
        url: `redis://${configService.get('REDIS_HOST', '127.0.0.1')}:${configService.get('REDIS_PORT', 6379)}`,
        database: Number(configService.get('REDIS_DB', 0)),
        password: configService.get('REDIS_PASSWORD'),
        ttl: 24 * 60 * 60 * 1000,
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', '127.0.0.1'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', '127.0.0.1'),
        port: Number(configService.get('DB_PORT', 3306)),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE', 'minaplay'),
        entities: ['dist/**/*.entity{.ts,.js}'],
        migrations: ['dist/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations_minaplay',
        synchronize: configService.get('APP_ENV') === 'dev',
        migrationsRun: configService.get('APP_ENV') !== 'dev',
      }),
    }),
    Aria2Module.registerAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        rpcHost: configService.get('ARIA2_RPC_HOST', '127.0.0.1'),
        rpcPort: Number(configService.get('ARIA2_RPC_PORT', 6800)),
        rpcPath: configService.get('ARIA2_RPC_PATH', '/jsonrpc'),
        rpcSecret: configService.get('ARIA2_RPC_SECRET'),
        autoUpdateTracker: Number(configService.get('ARIA2_AUTO_UPDATE_TRACKER', 0)) === 1,
        trackerListUrl: configService.get('ARIA2_TRACKER_LIST_URL'),
        expireHours: Number(configService.get('ARIA2_EXPIRE_HOURS', 0)) || 0,
        httpProxy: configService.get('APP_FETCH_HTTP_PROXY', undefined),
      }),
    }),
    LiveModule.registerAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        mediasoupWorkerNum: Number(configService.get('MS_WORKERS_NUM', cpus().length)),
        mediasoupAudioClockRate: Number(configService.get('MS_AUDIO_CLOCK_RATE', 48000)),
        mediasoupAudioChannel: Number(configService.get('MS_AUDIO_CHANNELS', 2)),
        mediasoupMaxIncomeBitrate: Number(configService.get('MS_AUDIO_MAX_INCOME_BITRATE', 1500000)),
        streamRtmpPort: Number(configService.get('STREAM_RTMP_PORT', 1935)),
        streamHttpPort: configService.get('STREAM_HTTP_PORT', 3001),
        streamChunkSize: Number(configService.get('STREAM_CHUNK_SIZE', 60000)),
        streamFfmpegPath: configService.get('FFMPEG_PATH', 'ffmpeg'),
        streamPublishKey: configService.get('STREAM_PUBLISH_KEY'),
      }),
    }),
    MediaModule.registerAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        ffmpegPath: configService.get('FFMPEG_PATH', 'ffmpeg'),
        ffprobePath: configService.get('FFPROBE_PATH', 'ffprobe'),
      }),
    }),
    SubscribeModule.registerAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        httpProxy: configService.get('APP_FETCH_HTTP_PROXY', undefined),
      }),
    }),
    NotificationModule.registerAsync({
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (configService: ConfigService) => ({
        smtpHost: configService.get('SMTP_HOST'),
        smtpPort: Number(configService.get('SMTP_PORT')),
        smtpSecure: Number(configService.get('SMTP_SECURE', 0)) === 1,
        smtpUser: configService.get('SMTP_USER'),
        smtpPassword: configService.get('SMTP_PASSWORD'),
        emailOrigin: configService.get('EMAIL_ORIGIN'),
        emailSubject: configService.get('EMAIL_SUBJECT'),
        appEnv: configService.get('APP_ENV', 'dev'),
      }),
    }),
    FileModule,
    AuthorizationModule,
    SeriesModule,
    UserModule,
    SystemModule,
    PluginModule.registerAsync(),
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
