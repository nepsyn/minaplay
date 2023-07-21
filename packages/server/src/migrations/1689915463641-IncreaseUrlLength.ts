import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncreaseUrlLength1689915463641 implements MigrationInterface {
  name = 'IncreaseUrlLength1689915463641';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`download_item\` DROP COLUMN \`url\``);
    await queryRunner.query(`ALTER TABLE \`download_item\` ADD \`url\` text NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`source\` DROP COLUMN \`url\``);
    await queryRunner.query(`ALTER TABLE \`source\` ADD \`url\` text NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`source\` DROP COLUMN \`url\``);
    await queryRunner.query(`ALTER TABLE \`source\` ADD \`url\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`download_item\` DROP COLUMN \`url\``);
    await queryRunner.query(`ALTER TABLE \`download_item\` ADD \`url\` varchar(255) NOT NULL`);
  }

}
