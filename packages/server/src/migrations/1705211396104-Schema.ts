import { MigrationInterface, QueryRunner } from "typeorm";

export class Schema1705211396104 implements MigrationInterface {
    name = 'Schema1705211396104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`permission\` (\`name\` varchar(255) NOT NULL, \`userId\` int NOT NULL, PRIMARY KEY (\`name\`, \`userId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`file\` (\`id\` varchar(36) NOT NULL, \`filename\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`size\` int NOT NULL, \`md5\` varchar(255) NOT NULL, \`mimetype\` varchar(255) NULL, \`source\` enum ('USER_UPLOAD', 'DOWNLOAD', 'AUTO_GENERATED') NOT NULL, \`path\` varchar(1024) NOT NULL, \`expireAt\` datetime NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`series_tag\` (\`name\` varchar(255) NOT NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`name\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`rule\` (\`id\` int NOT NULL AUTO_INCREMENT, \`remark\` varchar(255) NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`fileId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`parse_log\` (\`id\` varchar(36) NOT NULL, \`status\` enum ('PENDING', 'PAUSED', 'SUCCESS', 'FAILED') NOT NULL, \`error\` text NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`sourceId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`download_item\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NULL, \`url\` text NOT NULL, \`hash\` varchar(255) NOT NULL, \`status\` enum ('PENDING', 'PAUSED', 'SUCCESS', 'FAILED') NOT NULL, \`error\` text NULL, \`entry\` text NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`ruleId\` int NULL, \`sourceId\` int NULL, \`logId\` varchar(36) NULL, UNIQUE INDEX \`IDX_1503e21c07046d7ef8aba40d6d\` (\`hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`media\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NULL, \`isPublic\` tinyint NOT NULL DEFAULT 1, \`metadata\` text NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`downloadId\` varchar(36) NULL, \`posterId\` varchar(36) NULL, \`fileId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`episode\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NULL, \`no\` varchar(255) NULL, \`pubAt\` datetime NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`mediaId\` varchar(36) NULL, \`seriesId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`series_subscribe\` (\`userId\` int NOT NULL, \`seriesId\` int NOT NULL, \`notify\` tinyint NULL DEFAULT 1, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`userId\`, \`seriesId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`series\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`season\` varchar(255) NULL, \`pubAt\` datetime NULL, \`finished\` tinyint NULL DEFAULT 0, \`count\` int NULL, \`description\` text NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NULL, \`posterId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NULL, \`notify\` tinyint NOT NULL DEFAULT 1, \`password\` varchar(255) NOT NULL, \`ticket\` varchar(255) NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`avatarId\` varchar(36) NULL, UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`source\` (\`id\` int NOT NULL AUTO_INCREMENT, \`url\` text NOT NULL, \`remark\` varchar(255) NULL, \`title\` varchar(255) NULL, \`cron\` varchar(255) NOT NULL DEFAULT '0 */30 * * * *', \`enabled\` tinyint NOT NULL DEFAULT 1, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`view_history\` (\`id\` varchar(36) NOT NULL, \`progress\` int NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`mediaId\` varchar(36) NULL, \`episodeId\` int NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`rule_error_log\` (\`id\` int NOT NULL AUTO_INCREMENT, \`entry\` text NULL, \`error\` text NOT NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`ruleId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`live\` (\`id\` varchar(36) NOT NULL, \`title\` varchar(255) NULL, \`password\` varchar(255) NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`posterId\` varchar(36) NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`action_log\` (\`id\` varchar(36) NOT NULL, \`ip\` varchar(255) NOT NULL, \`action\` varchar(255) NOT NULL, \`extra\` text NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`operatorId\` int NULL, \`targetId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notification_meta\` (\`id\` int NOT NULL AUTO_INCREMENT, \`service\` varchar(255) NOT NULL, \`events\` text NULL, \`enabled\` tinyint NOT NULL DEFAULT 0, \`config\` text NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`live_chat\` (\`id\` varchar(36) NOT NULL, \`type\` varchar(255) NOT NULL, \`content\` text NOT NULL, \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`liveId\` varchar(36) NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`rule_sources_source\` (\`ruleId\` int NOT NULL, \`sourceId\` int NOT NULL, INDEX \`IDX_4bc430f49861c37657faf265d0\` (\`ruleId\`), INDEX \`IDX_802e7c9ffbbe464bd848a92656\` (\`sourceId\`), PRIMARY KEY (\`ruleId\`, \`sourceId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`media_attachment_files\` (\`mediaId\` varchar(36) NOT NULL, \`fileId\` varchar(36) NOT NULL, INDEX \`IDX_e688752d418552c96ddceb9a9e\` (\`mediaId\`), INDEX \`IDX_337e0f1f9f098fb995ee7f667e\` (\`fileId\`), PRIMARY KEY (\`mediaId\`, \`fileId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`series_tags_series_tag\` (\`seriesId\` int NOT NULL, \`seriesTagName\` varchar(255) NOT NULL, INDEX \`IDX_ca993323929471bd8b623edb9b\` (\`seriesId\`), INDEX \`IDX_bee7b4ef446634a3451611f03a\` (\`seriesTagName\`), PRIMARY KEY (\`seriesId\`, \`seriesTagName\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`permission\` ADD CONSTRAINT \`FK_c60570051d297d8269fcdd9bc47\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`file\` ADD CONSTRAINT \`FK_b2d8e683f020f61115edea206b3\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`rule\` ADD CONSTRAINT \`FK_2952a30d05d90b805c055aa7886\` FOREIGN KEY (\`fileId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`parse_log\` ADD CONSTRAINT \`FK_be12a341481b9d0b1d043794b31\` FOREIGN KEY (\`sourceId\`) REFERENCES \`source\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`download_item\` ADD CONSTRAINT \`FK_f00a12e0bf2ae742fb8b7a8b7ef\` FOREIGN KEY (\`ruleId\`) REFERENCES \`rule\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`download_item\` ADD CONSTRAINT \`FK_23a017bba43457003da2bfbc559\` FOREIGN KEY (\`sourceId\`) REFERENCES \`source\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`download_item\` ADD CONSTRAINT \`FK_3c8cc71dc253a8bda6525d1661e\` FOREIGN KEY (\`logId\`) REFERENCES \`parse_log\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`media\` ADD CONSTRAINT \`FK_4841bb1d4497db26e56a9edabd9\` FOREIGN KEY (\`downloadId\`) REFERENCES \`download_item\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`media\` ADD CONSTRAINT \`FK_fd7e95f0dae1b10d20cb375be6d\` FOREIGN KEY (\`posterId\`) REFERENCES \`file\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`media\` ADD CONSTRAINT \`FK_4e8cb463576d90330b25a8534c7\` FOREIGN KEY (\`fileId\`) REFERENCES \`file\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`episode\` ADD CONSTRAINT \`FK_08dcd3bf79a0b2c406967f64ad1\` FOREIGN KEY (\`mediaId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`episode\` ADD CONSTRAINT \`FK_6664832a677738a53b1e29a07e7\` FOREIGN KEY (\`seriesId\`) REFERENCES \`series\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`series_subscribe\` ADD CONSTRAINT \`FK_f1e6afc14333ee0846359b19793\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`series_subscribe\` ADD CONSTRAINT \`FK_80d365aea859eff0166b60c4e91\` FOREIGN KEY (\`seriesId\`) REFERENCES \`series\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`series\` ADD CONSTRAINT \`FK_56b2fd95ff296de2ae6d318fdfe\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`series\` ADD CONSTRAINT \`FK_eea2f20add3bd18c4dc851bc2cc\` FOREIGN KEY (\`posterId\`) REFERENCES \`file\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_58f5c71eaab331645112cf8cfa5\` FOREIGN KEY (\`avatarId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`source\` ADD CONSTRAINT \`FK_ee6c36f54891cc9dc488a778a2b\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`view_history\` ADD CONSTRAINT \`FK_e5d6405eaf1c0d04b21a905f6b2\` FOREIGN KEY (\`mediaId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`view_history\` ADD CONSTRAINT \`FK_747e1b3307c7dfa69f9c8396a76\` FOREIGN KEY (\`episodeId\`) REFERENCES \`episode\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`view_history\` ADD CONSTRAINT \`FK_ca41c48e8276a96ba829675ef5d\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`rule_error_log\` ADD CONSTRAINT \`FK_391aeb525e0a9fb65445c77b9a2\` FOREIGN KEY (\`ruleId\`) REFERENCES \`rule\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`live\` ADD CONSTRAINT \`FK_a7dd2df57371a73bfe3a050a8cd\` FOREIGN KEY (\`posterId\`) REFERENCES \`file\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`live\` ADD CONSTRAINT \`FK_edcfbd2bec0ad90cef885009c53\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`action_log\` ADD CONSTRAINT \`FK_1edc7527ef8522ec0775b457fd6\` FOREIGN KEY (\`operatorId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`action_log\` ADD CONSTRAINT \`FK_3ae4a33eaf8f3270b447a8959a0\` FOREIGN KEY (\`targetId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notification_meta\` ADD CONSTRAINT \`FK_ab8ed256d514b62c69c6ddf1c2c\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`live_chat\` ADD CONSTRAINT \`FK_f7daa054784e42febe527143124\` FOREIGN KEY (\`liveId\`) REFERENCES \`live\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`live_chat\` ADD CONSTRAINT \`FK_ffa00cf1b8f5b6bbc372f205ee5\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`rule_sources_source\` ADD CONSTRAINT \`FK_4bc430f49861c37657faf265d0f\` FOREIGN KEY (\`ruleId\`) REFERENCES \`rule\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`rule_sources_source\` ADD CONSTRAINT \`FK_802e7c9ffbbe464bd848a92656c\` FOREIGN KEY (\`sourceId\`) REFERENCES \`source\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`media_attachment_files\` ADD CONSTRAINT \`FK_e688752d418552c96ddceb9a9e3\` FOREIGN KEY (\`mediaId\`) REFERENCES \`media\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`media_attachment_files\` ADD CONSTRAINT \`FK_337e0f1f9f098fb995ee7f667e0\` FOREIGN KEY (\`fileId\`) REFERENCES \`file\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`series_tags_series_tag\` ADD CONSTRAINT \`FK_ca993323929471bd8b623edb9b1\` FOREIGN KEY (\`seriesId\`) REFERENCES \`series\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`series_tags_series_tag\` ADD CONSTRAINT \`FK_bee7b4ef446634a3451611f03ae\` FOREIGN KEY (\`seriesTagName\`) REFERENCES \`series_tag\`(\`name\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`series_tags_series_tag\` DROP FOREIGN KEY \`FK_bee7b4ef446634a3451611f03ae\``);
        await queryRunner.query(`ALTER TABLE \`series_tags_series_tag\` DROP FOREIGN KEY \`FK_ca993323929471bd8b623edb9b1\``);
        await queryRunner.query(`ALTER TABLE \`media_attachment_files\` DROP FOREIGN KEY \`FK_337e0f1f9f098fb995ee7f667e0\``);
        await queryRunner.query(`ALTER TABLE \`media_attachment_files\` DROP FOREIGN KEY \`FK_e688752d418552c96ddceb9a9e3\``);
        await queryRunner.query(`ALTER TABLE \`rule_sources_source\` DROP FOREIGN KEY \`FK_802e7c9ffbbe464bd848a92656c\``);
        await queryRunner.query(`ALTER TABLE \`rule_sources_source\` DROP FOREIGN KEY \`FK_4bc430f49861c37657faf265d0f\``);
        await queryRunner.query(`ALTER TABLE \`live_chat\` DROP FOREIGN KEY \`FK_ffa00cf1b8f5b6bbc372f205ee5\``);
        await queryRunner.query(`ALTER TABLE \`live_chat\` DROP FOREIGN KEY \`FK_f7daa054784e42febe527143124\``);
        await queryRunner.query(`ALTER TABLE \`notification_meta\` DROP FOREIGN KEY \`FK_ab8ed256d514b62c69c6ddf1c2c\``);
        await queryRunner.query(`ALTER TABLE \`action_log\` DROP FOREIGN KEY \`FK_3ae4a33eaf8f3270b447a8959a0\``);
        await queryRunner.query(`ALTER TABLE \`action_log\` DROP FOREIGN KEY \`FK_1edc7527ef8522ec0775b457fd6\``);
        await queryRunner.query(`ALTER TABLE \`live\` DROP FOREIGN KEY \`FK_edcfbd2bec0ad90cef885009c53\``);
        await queryRunner.query(`ALTER TABLE \`live\` DROP FOREIGN KEY \`FK_a7dd2df57371a73bfe3a050a8cd\``);
        await queryRunner.query(`ALTER TABLE \`rule_error_log\` DROP FOREIGN KEY \`FK_391aeb525e0a9fb65445c77b9a2\``);
        await queryRunner.query(`ALTER TABLE \`view_history\` DROP FOREIGN KEY \`FK_ca41c48e8276a96ba829675ef5d\``);
        await queryRunner.query(`ALTER TABLE \`view_history\` DROP FOREIGN KEY \`FK_747e1b3307c7dfa69f9c8396a76\``);
        await queryRunner.query(`ALTER TABLE \`view_history\` DROP FOREIGN KEY \`FK_e5d6405eaf1c0d04b21a905f6b2\``);
        await queryRunner.query(`ALTER TABLE \`source\` DROP FOREIGN KEY \`FK_ee6c36f54891cc9dc488a778a2b\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_58f5c71eaab331645112cf8cfa5\``);
        await queryRunner.query(`ALTER TABLE \`series\` DROP FOREIGN KEY \`FK_eea2f20add3bd18c4dc851bc2cc\``);
        await queryRunner.query(`ALTER TABLE \`series\` DROP FOREIGN KEY \`FK_56b2fd95ff296de2ae6d318fdfe\``);
        await queryRunner.query(`ALTER TABLE \`series_subscribe\` DROP FOREIGN KEY \`FK_80d365aea859eff0166b60c4e91\``);
        await queryRunner.query(`ALTER TABLE \`series_subscribe\` DROP FOREIGN KEY \`FK_f1e6afc14333ee0846359b19793\``);
        await queryRunner.query(`ALTER TABLE \`episode\` DROP FOREIGN KEY \`FK_6664832a677738a53b1e29a07e7\``);
        await queryRunner.query(`ALTER TABLE \`episode\` DROP FOREIGN KEY \`FK_08dcd3bf79a0b2c406967f64ad1\``);
        await queryRunner.query(`ALTER TABLE \`media\` DROP FOREIGN KEY \`FK_4e8cb463576d90330b25a8534c7\``);
        await queryRunner.query(`ALTER TABLE \`media\` DROP FOREIGN KEY \`FK_fd7e95f0dae1b10d20cb375be6d\``);
        await queryRunner.query(`ALTER TABLE \`media\` DROP FOREIGN KEY \`FK_4841bb1d4497db26e56a9edabd9\``);
        await queryRunner.query(`ALTER TABLE \`download_item\` DROP FOREIGN KEY \`FK_3c8cc71dc253a8bda6525d1661e\``);
        await queryRunner.query(`ALTER TABLE \`download_item\` DROP FOREIGN KEY \`FK_23a017bba43457003da2bfbc559\``);
        await queryRunner.query(`ALTER TABLE \`download_item\` DROP FOREIGN KEY \`FK_f00a12e0bf2ae742fb8b7a8b7ef\``);
        await queryRunner.query(`ALTER TABLE \`parse_log\` DROP FOREIGN KEY \`FK_be12a341481b9d0b1d043794b31\``);
        await queryRunner.query(`ALTER TABLE \`rule\` DROP FOREIGN KEY \`FK_2952a30d05d90b805c055aa7886\``);
        await queryRunner.query(`ALTER TABLE \`file\` DROP FOREIGN KEY \`FK_b2d8e683f020f61115edea206b3\``);
        await queryRunner.query(`ALTER TABLE \`permission\` DROP FOREIGN KEY \`FK_c60570051d297d8269fcdd9bc47\``);
        await queryRunner.query(`DROP INDEX \`IDX_bee7b4ef446634a3451611f03a\` ON \`series_tags_series_tag\``);
        await queryRunner.query(`DROP INDEX \`IDX_ca993323929471bd8b623edb9b\` ON \`series_tags_series_tag\``);
        await queryRunner.query(`DROP TABLE \`series_tags_series_tag\``);
        await queryRunner.query(`DROP INDEX \`IDX_337e0f1f9f098fb995ee7f667e\` ON \`media_attachment_files\``);
        await queryRunner.query(`DROP INDEX \`IDX_e688752d418552c96ddceb9a9e\` ON \`media_attachment_files\``);
        await queryRunner.query(`DROP TABLE \`media_attachment_files\``);
        await queryRunner.query(`DROP INDEX \`IDX_802e7c9ffbbe464bd848a92656\` ON \`rule_sources_source\``);
        await queryRunner.query(`DROP INDEX \`IDX_4bc430f49861c37657faf265d0\` ON \`rule_sources_source\``);
        await queryRunner.query(`DROP TABLE \`rule_sources_source\``);
        await queryRunner.query(`DROP TABLE \`live_chat\``);
        await queryRunner.query(`DROP TABLE \`notification_meta\``);
        await queryRunner.query(`DROP TABLE \`action_log\``);
        await queryRunner.query(`DROP TABLE \`live\``);
        await queryRunner.query(`DROP TABLE \`rule_error_log\``);
        await queryRunner.query(`DROP TABLE \`view_history\``);
        await queryRunner.query(`DROP TABLE \`source\``);
        await queryRunner.query(`DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`series\``);
        await queryRunner.query(`DROP TABLE \`series_subscribe\``);
        await queryRunner.query(`DROP TABLE \`episode\``);
        await queryRunner.query(`DROP TABLE \`media\``);
        await queryRunner.query(`DROP INDEX \`IDX_1503e21c07046d7ef8aba40d6d\` ON \`download_item\``);
        await queryRunner.query(`DROP TABLE \`download_item\``);
        await queryRunner.query(`DROP TABLE \`parse_log\``);
        await queryRunner.query(`DROP TABLE \`rule\``);
        await queryRunner.query(`DROP TABLE \`series_tag\``);
        await queryRunner.query(`DROP TABLE \`file\``);
        await queryRunner.query(`DROP TABLE \`permission\``);
    }

}
