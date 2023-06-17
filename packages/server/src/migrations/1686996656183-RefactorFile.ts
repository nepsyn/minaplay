import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorFile1686996656183 implements MigrationInterface {
    name = 'RefactorFile1686996656183'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`file\` ADD \`deleteAt\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`subscribe_rule\` DROP FOREIGN KEY \`FK_d0008ada09db1558e3359d4c7c2\``);
        await queryRunner.query(`ALTER TABLE \`episode\` DROP FOREIGN KEY \`FK_e30597706c8769faf969ad2f9cb\``);
        await queryRunner.query(`ALTER TABLE \`series\` DROP FOREIGN KEY \`FK_eea2f20add3bd18c4dc851bc2cc\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_58f5c71eaab331645112cf8cfa5\``);
        await queryRunner.query(`ALTER TABLE \`live\` DROP FOREIGN KEY \`FK_a7dd2df57371a73bfe3a050a8cd\``);
        await queryRunner.query(`ALTER TABLE \`file\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`file\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`file\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`live_chat\` DROP FOREIGN KEY \`FK_f7daa054784e42febe527143124\``);
        await queryRunner.query(`ALTER TABLE \`live\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`live\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`live\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`live_chat\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`live_chat\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`live_chat\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`subscribe_fetch_error\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`subscribe_fetch_error\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`subscribe_fetch_error\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`subscribe_download_item\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`subscribe_download_item\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`subscribe_download_item\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`subscribe_rule\` ADD CONSTRAINT \`FK_d0008ada09db1558e3359d4c7c2\` FOREIGN KEY (\`codeFileId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`episode\` ADD CONSTRAINT \`FK_e30597706c8769faf969ad2f9cb\` FOREIGN KEY (\`fileId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`series\` ADD CONSTRAINT \`FK_eea2f20add3bd18c4dc851bc2cc\` FOREIGN KEY (\`posterId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_58f5c71eaab331645112cf8cfa5\` FOREIGN KEY (\`avatarId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`live\` ADD CONSTRAINT \`FK_a7dd2df57371a73bfe3a050a8cd\` FOREIGN KEY (\`posterId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`live_chat\` ADD CONSTRAINT \`FK_f7daa054784e42febe527143124\` FOREIGN KEY (\`liveId\`) REFERENCES \`live\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`live_chat\` DROP FOREIGN KEY \`FK_f7daa054784e42febe527143124\``);
        await queryRunner.query(`ALTER TABLE \`live\` DROP FOREIGN KEY \`FK_a7dd2df57371a73bfe3a050a8cd\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_58f5c71eaab331645112cf8cfa5\``);
        await queryRunner.query(`ALTER TABLE \`series\` DROP FOREIGN KEY \`FK_eea2f20add3bd18c4dc851bc2cc\``);
        await queryRunner.query(`ALTER TABLE \`episode\` DROP FOREIGN KEY \`FK_e30597706c8769faf969ad2f9cb\``);
        await queryRunner.query(`ALTER TABLE \`subscribe_rule\` DROP FOREIGN KEY \`FK_d0008ada09db1558e3359d4c7c2\``);
        await queryRunner.query(`ALTER TABLE \`subscribe_download_item\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`subscribe_download_item\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`subscribe_download_item\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`subscribe_fetch_error\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`subscribe_fetch_error\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`subscribe_fetch_error\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`live_chat\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`live_chat\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`live_chat\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`live\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`live\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`live\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`live_chat\` ADD CONSTRAINT \`FK_f7daa054784e42febe527143124\` FOREIGN KEY (\`liveId\`) REFERENCES \`live\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`file\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`file\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`live\` ADD CONSTRAINT \`FK_a7dd2df57371a73bfe3a050a8cd\` FOREIGN KEY (\`posterId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_58f5c71eaab331645112cf8cfa5\` FOREIGN KEY (\`avatarId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`series\` ADD CONSTRAINT \`FK_eea2f20add3bd18c4dc851bc2cc\` FOREIGN KEY (\`posterId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`episode\` ADD CONSTRAINT \`FK_e30597706c8769faf969ad2f9cb\` FOREIGN KEY (\`fileId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`subscribe_rule\` ADD CONSTRAINT \`FK_d0008ada09db1558e3359d4c7c2\` FOREIGN KEY (\`codeFileId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`file\` DROP COLUMN \`deleteAt\``);
    }

}
