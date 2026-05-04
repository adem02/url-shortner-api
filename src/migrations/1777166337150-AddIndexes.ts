import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes1777166337150 implements MigrationInterface {
    name = 'AddIndexes1777166337150';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE INDEX "IDX_3e477bfbdf3a572363b65bc452" ON "clicks" ("link_id") ');
        await queryRunner.query('CREATE INDEX "IDX_52a3fa2a2c27a987ed58fd2ea4" ON "links" ("code") ');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "public"."IDX_52a3fa2a2c27a987ed58fd2ea4"');
        await queryRunner.query('DROP INDEX "public"."IDX_3e477bfbdf3a572363b65bc452"');
    }

}
