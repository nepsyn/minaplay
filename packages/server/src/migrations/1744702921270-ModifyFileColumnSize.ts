import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifyFileColumnSize1744702921270 implements MigrationInterface {
    name = 'ModifyFileColumnSize1744702921270'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`file\` MODIFY COLUMN \`filename\` varchar(512) NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` MODIFY COLUMN \`name\` varchar(512) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` MODIFY COLUMN \`size\` bigint UNSIGNED NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` MODIFY COLUMN \`path\` varchar(4096) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`file\` MODIFY COLUMN \`path\` varchar(1024) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` MODIFY COLUMN \`size\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` MODIFY COLUMN \`name\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` MODIFY COLUMN \`filename\` varchar(255) NULL`);
    }

}
