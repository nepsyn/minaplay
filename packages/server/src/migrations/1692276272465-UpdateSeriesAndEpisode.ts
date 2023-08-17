import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSeriesAndEpisode1692276272465 implements MigrationInterface {
    name = 'UpdateSeriesAndEpisode1692276272465'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`series\` DROP FOREIGN KEY \`FK_e9d7ecbaa47516086e238281245\``);
        await queryRunner.query(`ALTER TABLE \`series\` DROP COLUMN \`posterLandscapeId\``);
        await queryRunner.query(`ALTER TABLE \`episode\` ADD \`title\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`episode\` DROP COLUMN \`title\``);
        await queryRunner.query(`ALTER TABLE \`series\` ADD \`posterLandscapeId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`series\` ADD CONSTRAINT \`FK_e9d7ecbaa47516086e238281245\` FOREIGN KEY (\`posterLandscapeId\`) REFERENCES \`file\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
