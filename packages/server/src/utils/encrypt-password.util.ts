import { hash } from 'bcrypt';

export async function encryptPassword(password: string) {
  return await hash(password, 10);
}
