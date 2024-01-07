import { NestFactory } from '@nestjs/core';
import input from '@inquirer/input';
import password from '@inquirer/password';
import process from 'node:process';
import { isString } from 'class-validator';
import { encryptPassword } from '../utils/encrypt-password.util';
import { PermissionEnum } from '../enums/permission.enum';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../modules/user/user.entity';
import { Repository } from 'typeorm';
import { Permission } from '../modules/authorization/permission.entity';
import { ApplicationScriptModule } from '../common/application.script.module';

export async function addRootUser() {
  const app = await NestFactory.createApplicationContext(ApplicationScriptModule, {
    logger: ['error'],
  });
  const userRepo: Repository<User> = app.get(getRepositoryToken(User));
  const permissionRepo: Repository<Permission> = app.get(getRepositoryToken(Permission));

  const username = await input({
    message: 'Input root user username:',
    validate: (v) => isString(v) && v.length >= 2 && v.length <= 40,
    transformer: (v) => v.trim(),
  });
  const sameNameUser = await userRepo.findOneBy({ username });
  if (sameNameUser) {
    process.stderr.write(`Duplicated username '${username}' in database.\n`);
    process.exit();
  }

  const pass = await password({
    message: 'Input root user password:',
    validate: (v) => isString(v) && v.length >= 6 && v.length <= 40,
    mask: '*',
  });
  const passConfirm = await password({
    message: 'Confirm root user password:',
    validate: (v) => isString(v) && v.length >= 6 && v.length <= 40,
    mask: '*',
  });
  if (pass !== passConfirm) {
    process.stderr.write('Passwords do not match.\n');
    process.exit();
  }

  try {
    const { id } = await userRepo.save({
      username,
      password: await encryptPassword(pass),
    });
    await permissionRepo.save({
      userId: id,
      name: PermissionEnum.ROOT_OP,
    });
    process.stdout.write(`Root user '${username}' added successfully.\n`);
  } catch (error) {
    process.stderr.write(`Root user '${username}' add failed, error: ${error.message}`);
  }

  await app.close();
}

addRootUser();
