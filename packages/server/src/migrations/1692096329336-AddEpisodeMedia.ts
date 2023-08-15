import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEpisodeMedia1692096329336 implements MigrationInterface {
    name = 'AddEpisodeMedia1692096329336'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`episode\` ADD \`mediaId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`episode\` ADD CONSTRAINT \`FK_08dcd3bf79a0b2c406967f64ad1\` FOREIGN KEY (\`mediaId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`episode\` DROP FOREIGN KEY \`FK_08dcd3bf79a0b2c406967f64ad1\``);
        await queryRunner.query(`ALTER TABLE \`episode\` DROP COLUMN \`mediaId\``);
    }

}
