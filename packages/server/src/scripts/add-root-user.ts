import { NestFactory } from '@nestjs/core';
import input from '@inquirer/input';
import password from '@inquirer/password';
import process from 'node:process';
import { isString } from 'class-validator';
import { encryptPassword } from '../utils/encrypt-password.util';
import { PermissionEnum } from '../enums/permission.enum';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/user/user.entity';
import { Repository } from 'typeorm';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Permission } from '../modules/authorization/permission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
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
        retryAttempts: 3,
      }),
    }),
    TypeOrmModule.forFeature([User, Permission]),
  ],
})
class ScriptModule {}

export async function addRootUser() {
  const app = await NestFactory.createApplicationContext(ScriptModule, {
    logger: ['error'],
  });
  const userRepo: Repository<User> = app.get(getRepositoryToken(User));
  const permissionRepo: Repository<Permission> = app.get(getRepositoryToken(Permission));

  const username = await input({
    message: 'Please input username:',
    validate: (v) => isString(v) && v.length >= 1,
    transformer: (v) => v.trim(),
  });
  const sameNameUser = await userRepo.findOneBy({ username });
  if (sameNameUser) {
    process.stderr.write(`Duplicated username '${username}' in database.\n`);
    process.exit();
  }

  const pass = await password({
    message: 'Please input password:',
    validate: (v) => isString(v) && v.length >= 6 && v.length <= 20,
    mask: '*',
  });
  const passConfirm = await password({
    message: 'Please confirm password again:',
    validate: (v) => isString(v) && v.length >= 6 && v.length <= 20,
    mask: '*',
  });
  if (pass !== passConfirm) {
    process.stderr.write('The two passwords do not match.\n');
    process.exit();
  }

  try {
    const { id } = await userRepo.save({
      username,
      password: await encryptPassword(pass),
      permissions: [{ name: PermissionEnum.ROOT_OP }],
    });
    await permissionRepo.save({
      userId: id,
      name: PermissionEnum.ROOT_OP,
    });
    process.stdout.write(`Add root user '${username}' succeed.\n`);
  } catch (error) {
    process.stderr.write(`Add root user '${username}' failed, error: ${error.message}`);
  }

  await app.close();
}

addRootUser();
