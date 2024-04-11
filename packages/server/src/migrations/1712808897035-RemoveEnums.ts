import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEnums1712808897035 implements MigrationInterface {
    name = 'RemoveEnums1712808897035'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`file\` CHANGE \`filename\` \`filename\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` CHANGE \`size\` \`size\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` CHANGE \`md5\` \`md5\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` CHANGE \`source\` \`source\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`parse_log\` CHANGE \`status\` \`status\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`download_item\` CHANGE \`status\` \`status\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`notification_meta\` DROP FOREIGN KEY \`FK_ab8ed256d514b62c69c6ddf1c2c\``);
        await queryRunner.query(`ALTER TABLE \`notification_meta\` CHANGE \`userId\` \`userId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`notification_meta\` ADD CONSTRAINT \`FK_ab8ed256d514b62c69c6ddf1c2c\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notification_meta\` DROP FOREIGN KEY \`FK_ab8ed256d514b62c69c6ddf1c2c\``);
        await queryRunner.query(`ALTER TABLE \`notification_meta\` CHANGE \`userId\` \`userId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`notification_meta\` ADD CONSTRAINT \`FK_ab8ed256d514b62c69c6ddf1c2c\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`download_item\` CHANGE \`status\` \`status\` enum ('PENDING', 'PAUSED', 'SUCCESS', 'FAILED') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`parse_log\` CHANGE \`status\` \`status\` enum ('PENDING', 'PAUSED', 'SUCCESS', 'FAILED') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` CHANGE \`source\` \`source\` enum ('USER_UPLOAD', 'DOWNLOAD', 'AUTO_GENERATED') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` CHANGE \`md5\` \`md5\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` CHANGE \`size\` \`size\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`file\` CHANGE \`filename\` \`filename\` varchar(255) NOT NULL`);
    }

}
