import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../modules/user/user.entity.js';
import { NestFactory } from '@nestjs/core';
import { Repository } from 'typeorm';
import input from '@inquirer/input';
import { ApplicationScriptModule } from '../common/application.script.module.js';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import path from 'node:path';

export async function deleteUser() {
  const app = await NestFactory.createApplicationContext(ApplicationScriptModule, {
    logger: ['error'],
  });
  const userRepo: Repository<User> = app.get(getRepositoryToken(User));

  const username = await input({
    message: 'Input user username:',
    transformer: (v) => v.trim(),
  });
  const user = await userRepo.findOneBy({ username });
  if (!user) {
    process.stderr.write(`User '${username}' not found in database.\n`);
    process.exit();
  }

  try {
    await userRepo.delete({ username });
    process.stdout.write(`User '${username}' deleted successfully.\n`);
  } catch (error) {
    process.stderr.write(`User '${username}' delete failed, error: ${error.stack}`);
  }

  await app.close();
}

if (path.basename(fileURLToPath(import.meta.url)) === path.basename(process.argv[1])) {
  deleteUser();
}
