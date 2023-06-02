import { MigrationInterface, QueryRunner } from 'typeorm';
import { hash } from 'bcrypt';
import { PermissionEnum } from '../enums/permission.enum';

export class AddRootUser1685282226999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const password = await hash('root', 10);
    await queryRunner.query(`INSERT INTO \`user\` (username, password) VALUES ('root','${password}')`);
    for (const key in PermissionEnum) {
      const permission = PermissionEnum[key];
      await queryRunner.query(`INSERT INTO \`permission\` VALUES ('${permission}','${permission}')`);
      await queryRunner.query(`INSERT INTO \`user_permissions_permission\` VALUES (1,'${permission}')`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.clearTable('user_permissions_permission');
    await queryRunner.clearTable('permission');
    await queryRunner.clearTable('user');
  }
}
