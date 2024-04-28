import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRuleParserMeta1714291901324 implements MigrationInterface {
    name = 'AddRuleParserMeta1714291901324'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`source\` ADD \`parserMeta\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`rule\` ADD \`parserMeta\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`rule\` DROP FOREIGN KEY \`FK_2952a30d05d90b805c055aa7886\``);
        await queryRunner.query(`ALTER TABLE \`rule\` ADD CONSTRAINT \`FK_2952a30d05d90b805c055aa7886\` FOREIGN KEY (\`fileId\`) REFERENCES \`file\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`rule\` DROP COLUMN \`parserMeta\``);
        await queryRunner.query(`ALTER TABLE \`source\` DROP COLUMN \`parserMeta\``);
        await queryRunner.query(`ALTER TABLE \`rule\` DROP FOREIGN KEY \`FK_2952a30d05d90b805c055aa7886\``);
        await queryRunner.query(`ALTER TABLE \`rule\` ADD CONSTRAINT \`FK_2952a30d05d90b805c055aa7886\` FOREIGN KEY (\`fileId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
