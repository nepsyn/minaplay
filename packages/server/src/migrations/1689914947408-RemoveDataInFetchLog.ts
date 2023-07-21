import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDataInFetchLog1689914947408 implements MigrationInterface {
  name = 'RemoveDataInFetchLog1689914947408';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`fetch_log\` DROP COLUMN \`data\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`fetch_log\` ADD \`data\` text NULL`);
  }
}
