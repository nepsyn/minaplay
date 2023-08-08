import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSeriesName1691480051634 implements MigrationInterface {
    name = 'UpdateSeriesName1691480051634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_68b808a9039892c61219f868f2\` ON \`series\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_68b808a9039892c61219f868f2\` ON \`series\` (\`name\`)`);
    }

}
