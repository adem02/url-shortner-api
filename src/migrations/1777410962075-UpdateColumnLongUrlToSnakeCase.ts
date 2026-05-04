import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateColumnLongUrlToSnakeCase1777410962075 implements MigrationInterface {
    name = 'UpdateColumnLongUrlToSnakeCase1777410962075';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "links" RENAME COLUMN "longUrl" TO "long_url"');
        await queryRunner.query('ALTER TABLE "clicks" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()');
        await queryRunner.query('ALTER TABLE "clicks" DROP CONSTRAINT "FK_3e477bfbdf3a572363b65bc4525"');
        await queryRunner.query('ALTER TABLE "links" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()');
        await queryRunner.query('ALTER TABLE "clicks" ADD CONSTRAINT "FK_3e477bfbdf3a572363b65bc4525" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "clicks" DROP CONSTRAINT "FK_3e477bfbdf3a572363b65bc4525"');
        await queryRunner.query('ALTER TABLE "links" ALTER COLUMN "id" DROP DEFAULT');
        await queryRunner.query('ALTER TABLE "clicks" ADD CONSTRAINT "FK_3e477bfbdf3a572363b65bc4525" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
        await queryRunner.query('ALTER TABLE "clicks" ALTER COLUMN "id" DROP DEFAULT');
        await queryRunner.query('ALTER TABLE "links" RENAME COLUMN "long_url" TO "longUrl"');
    }

}
