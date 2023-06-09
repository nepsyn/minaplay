import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1685281459266 implements MigrationInterface {
  name = 'Initial1685281459266';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`file\` (\`id\` varchar(36) NOT NULL, \`filename\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`size\` int NOT NULL, \`md5\` varchar(255) NOT NULL, \`mimetype\` varchar(255) NULL, \`source\` enum ('USER_UPLOAD', 'ARIA2_DOWNLOAD') NOT NULL, \`path\` varchar(255) NOT NULL, \`expireAt\` datetime NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`subscribe_source\` (\`id\` int NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NOT NULL, \`remark\` varchar(255) NULL, \`title\` varchar(255) NULL, \`cron\` varchar(255) NOT NULL DEFAULT '0 */30 * * * *', \`enabled\` tinyint NOT NULL DEFAULT 1, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteAt\` datetime(6) NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`subscribe_rule\` (\`id\` int NOT NULL AUTO_INCREMENT, \`remark\` varchar(255) NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteAt\` datetime(6) NULL, \`codeFileId\` varchar(36) NULL, \`sourceId\` int NULL, \`seriesId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`series_tag\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteAt\` datetime(6) NULL, UNIQUE INDEX \`IDX_61e1b959a633a450864a41d2c6\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`episode\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`no\` varchar(255) NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteAt\` datetime(6) NULL, \`fileId\` varchar(36) NULL, \`seriesId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`series\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteAt\` datetime(6) NULL, \`userId\` int NULL, \`posterId\` varchar(36) NULL, UNIQUE INDEX \`IDX_68b808a9039892c61219f868f2\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NULL, \`password\` varchar(255) NOT NULL, \`ticket\` varchar(255) NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteAt\` datetime(6) NULL, \`avatarId\` varchar(36) NULL, UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`permission\` (\`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, PRIMARY KEY (\`name\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`live\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NULL, \`password\` varchar(255) NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleteAt\` datetime(6) NULL, \`posterId\` varchar(36) NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`subscribe_fetch_error\` (\`id\` varchar(36) NOT NULL, \`error\` varchar(255) NOT NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`sourceId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`subscribe_download_item\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NOT NULL, \`url\` varchar(255) NOT NULL, \`status\` enum ('DOWNLOADED', 'DOWNLOADING', 'FAILED') NOT NULL, \`error\` varchar(255) NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`ruleId\` int NULL, UNIQUE INDEX \`IDX_ded7738e5067958cf5f828f918\` (\`title\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`series_tags_series_tag\` (\`seriesId\` int NOT NULL, \`seriesTagId\` int NOT NULL, INDEX \`IDX_ca993323929471bd8b623edb9b\` (\`seriesId\`), INDEX \`IDX_73a4d6ff29acddce2059d6aa78\` (\`seriesTagId\`), PRIMARY KEY (\`seriesId\`, \`seriesTagId\`)) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE \`user_permissions_permission\` (\`userId\` int NOT NULL, \`permissionName\` varchar(255) NOT NULL, INDEX \`IDX_5b72d197d92b8bafbe7906782e\` (\`userId\`), INDEX \`IDX_7691aabb0be21b97826f754a31\` (\`permissionName\`), PRIMARY KEY (\`userId\`, \`permissionName\`)) ENGINE=InnoDB`);
    await queryRunner.query(`ALTER TABLE \`file\` ADD CONSTRAINT \`FK_b2d8e683f020f61115edea206b3\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`subscribe_source\` ADD CONSTRAINT \`FK_13bfbd9e6847e7f374dabd00cbd\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`subscribe_rule\` ADD CONSTRAINT \`FK_d0008ada09db1558e3359d4c7c2\` FOREIGN KEY (\`codeFileId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`subscribe_rule\` ADD CONSTRAINT \`FK_ca143c71bac4a103078048c4393\` FOREIGN KEY (\`sourceId\`) REFERENCES \`subscribe_source\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`subscribe_rule\` ADD CONSTRAINT \`FK_7e61854a8a60b922139c043f025\` FOREIGN KEY (\`seriesId\`) REFERENCES \`series\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`episode\` ADD CONSTRAINT \`FK_e30597706c8769faf969ad2f9cb\` FOREIGN KEY (\`fileId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`episode\` ADD CONSTRAINT \`FK_6664832a677738a53b1e29a07e7\` FOREIGN KEY (\`seriesId\`) REFERENCES \`series\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`series\` ADD CONSTRAINT \`FK_56b2fd95ff296de2ae6d318fdfe\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`series\` ADD CONSTRAINT \`FK_eea2f20add3bd18c4dc851bc2cc\` FOREIGN KEY (\`posterId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_58f5c71eaab331645112cf8cfa5\` FOREIGN KEY (\`avatarId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`live\` ADD CONSTRAINT \`FK_a7dd2df57371a73bfe3a050a8cd\` FOREIGN KEY (\`posterId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`live\` ADD CONSTRAINT \`FK_edcfbd2bec0ad90cef885009c53\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`subscribe_fetch_error\` ADD CONSTRAINT \`FK_8a4dc988c1ae6fb727c6a4de94d\` FOREIGN KEY (\`sourceId\`) REFERENCES \`subscribe_source\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`subscribe_download_item\` ADD CONSTRAINT \`FK_3033b9792e46d90c456f782538d\` FOREIGN KEY (\`ruleId\`) REFERENCES \`subscribe_rule\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`series_tags_series_tag\` ADD CONSTRAINT \`FK_ca993323929471bd8b623edb9b1\` FOREIGN KEY (\`seriesId\`) REFERENCES \`series\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE \`series_tags_series_tag\` ADD CONSTRAINT \`FK_73a4d6ff29acddce2059d6aa782\` FOREIGN KEY (\`seriesTagId\`) REFERENCES \`series_tag\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE \`user_permissions_permission\` ADD CONSTRAINT \`FK_5b72d197d92b8bafbe7906782ec\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    await queryRunner.query(`ALTER TABLE \`user_permissions_permission\` ADD CONSTRAINT \`FK_7691aabb0be21b97826f754a312\` FOREIGN KEY (\`permissionName\`) REFERENCES \`permission\`(\`name\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user_permissions_permission\` DROP FOREIGN KEY \`FK_7691aabb0be21b97826f754a312\``);
    await queryRunner.query(`ALTER TABLE \`user_permissions_permission\` DROP FOREIGN KEY \`FK_5b72d197d92b8bafbe7906782ec\``);
    await queryRunner.query(`ALTER TABLE \`series_tags_series_tag\` DROP FOREIGN KEY \`FK_73a4d6ff29acddce2059d6aa782\``);
    await queryRunner.query(`ALTER TABLE \`series_tags_series_tag\` DROP FOREIGN KEY \`FK_ca993323929471bd8b623edb9b1\``);
    await queryRunner.query(`ALTER TABLE \`subscribe_download_item\` DROP FOREIGN KEY \`FK_3033b9792e46d90c456f782538d\``);
    await queryRunner.query(`ALTER TABLE \`subscribe_fetch_error\` DROP FOREIGN KEY \`FK_8a4dc988c1ae6fb727c6a4de94d\``);
    await queryRunner.query(`ALTER TABLE \`live\` DROP FOREIGN KEY \`FK_edcfbd2bec0ad90cef885009c53\``);
    await queryRunner.query(`ALTER TABLE \`live\` DROP FOREIGN KEY \`FK_a7dd2df57371a73bfe3a050a8cd\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_58f5c71eaab331645112cf8cfa5\``);
    await queryRunner.query(`ALTER TABLE \`series\` DROP FOREIGN KEY \`FK_eea2f20add3bd18c4dc851bc2cc\``);
    await queryRunner.query(`ALTER TABLE \`series\` DROP FOREIGN KEY \`FK_56b2fd95ff296de2ae6d318fdfe\``);
    await queryRunner.query(`ALTER TABLE \`episode\` DROP FOREIGN KEY \`FK_6664832a677738a53b1e29a07e7\``);
    await queryRunner.query(`ALTER TABLE \`episode\` DROP FOREIGN KEY \`FK_e30597706c8769faf969ad2f9cb\``);
    await queryRunner.query(`ALTER TABLE \`subscribe_rule\` DROP FOREIGN KEY \`FK_7e61854a8a60b922139c043f025\``);
    await queryRunner.query(`ALTER TABLE \`subscribe_rule\` DROP FOREIGN KEY \`FK_ca143c71bac4a103078048c4393\``);
    await queryRunner.query(`ALTER TABLE \`subscribe_rule\` DROP FOREIGN KEY \`FK_d0008ada09db1558e3359d4c7c2\``);
    await queryRunner.query(`ALTER TABLE \`subscribe_source\` DROP FOREIGN KEY \`FK_13bfbd9e6847e7f374dabd00cbd\``);
    await queryRunner.query(`ALTER TABLE \`file\` DROP FOREIGN KEY \`FK_b2d8e683f020f61115edea206b3\``);
    await queryRunner.query(`DROP INDEX \`IDX_7691aabb0be21b97826f754a31\` ON \`user_permissions_permission\``);
    await queryRunner.query(`DROP INDEX \`IDX_5b72d197d92b8bafbe7906782e\` ON \`user_permissions_permission\``);
    await queryRunner.query(`DROP TABLE \`user_permissions_permission\``);
    await queryRunner.query(`DROP INDEX \`IDX_73a4d6ff29acddce2059d6aa78\` ON \`series_tags_series_tag\``);
    await queryRunner.query(`DROP INDEX \`IDX_ca993323929471bd8b623edb9b\` ON \`series_tags_series_tag\``);
    await queryRunner.query(`DROP TABLE \`series_tags_series_tag\``);
    await queryRunner.query(`DROP INDEX \`IDX_ded7738e5067958cf5f828f918\` ON \`subscribe_download_item\``);
    await queryRunner.query(`DROP TABLE \`subscribe_download_item\``);
    await queryRunner.query(`DROP TABLE \`subscribe_fetch_error\``);
    await queryRunner.query(`DROP TABLE \`live\``);
    await queryRunner.query(`DROP TABLE \`permission\``);
    await queryRunner.query(`DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``);
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(`DROP INDEX \`IDX_68b808a9039892c61219f868f2\` ON \`series\``);
    await queryRunner.query(`DROP TABLE \`series\``);
    await queryRunner.query(`DROP TABLE \`episode\``);
    await queryRunner.query(`DROP INDEX \`IDX_61e1b959a633a450864a41d2c6\` ON \`series_tag\``);
    await queryRunner.query(`DROP TABLE \`series_tag\``);
    await queryRunner.query(`DROP TABLE \`subscribe_rule\``);
    await queryRunner.query(`DROP TABLE \`subscribe_source\``);
    await queryRunner.query(`DROP TABLE \`file\``);
  }
}
