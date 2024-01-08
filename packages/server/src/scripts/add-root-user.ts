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
import { File } from '../modules/file/file.entity';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { USER_UPLOAD_IMAGE_DIR } from '../constants';
import { createIdenticon } from '../utils/create-identicon.util';
import { generateMD5 } from '../utils/generate-md5.util';
import { FileSourceEnum } from '../enums/file-source.enum';

export async function addRootUser(_username?: string, _password?: string) {
  const app = await NestFactory.createApplicationContext(ApplicationScriptModule, {
    logger: ['error'],
  });
  const userRepo: Repository<User> = app.get(getRepositoryToken(User));
  const permissionRepo: Repository<Permission> = app.get(getRepositoryToken(Permission));
  const fileRepo: Repository<File> = app.get(getRepositoryToken(File));

  const username =
    _username ??
    (await input({
      message: 'Input root user username:',
      validate: (v) => isString(v) && v.length >= 2 && v.length <= 40,
      transformer: (v) => v.trim(),
    }));
  const sameNameUser = await userRepo.findOneBy({ username });
  if (sameNameUser) {
    process.stderr.write(`Duplicated username '${username}' in database.\n`);
    process.exit();
  }

  const pass =
    _password ??
    (await password({
      message: 'Input root user password:',
      validate: (v) => isString(v) && v.length >= 6 && v.length <= 40,
      mask: '*',
    }));
  const passConfirm =
    _password ??
    (await password({
      message: 'Confirm root user password:',
      validate: (v) => isString(v) && v.length >= 6 && v.length <= 40,
      mask: '*',
    }));
  if (pass !== passConfirm) {
    process.stderr.write('Passwords do not match.\n');
    process.exit();
  }

  try {
    const filename = randomUUID().replace(/-/g, '') + '.png';
    const filepath = path.join(USER_UPLOAD_IMAGE_DIR, filename);
    const { file: identicon, md5 } = await createIdenticon(await generateMD5(username), filepath);
    const file = await fileRepo.save({
      filename,
      name: filename,
      size: identicon.size,
      md5,
      source: FileSourceEnum.AUTO_GENERATED,
      path: filepath,
    });

    const { id } = await userRepo.save({
      username,
      password: await encryptPassword(pass),
      avatar: { id: file.id },
    });
    await permissionRepo.save({
      userId: id,
      name: PermissionEnum.ROOT_OP,
    });
    process.stdout.write(`Root user '${username}' added successfully.\n`);
  } catch (error) {
    process.stderr.write(`Root user '${username}' add failed, error: ${error.stack}`);
  }

  await app.close();
}

if (require.main === module) {
  addRootUser();
}
