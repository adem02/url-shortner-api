import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClickAndLinkTables1777166011044 implements MigrationInterface {
    name = 'CreateClickAndLinkTables1777166011044';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE "clicks" ("id" uuid NOT NULL, "country" character varying(2), "device" character varying(20), "browser" character varying(50), "clicked_at" TIMESTAMP NOT NULL DEFAULT now(), "link_id" uuid, CONSTRAINT "PK_7765d7ffdeb0ed2675651020814" PRIMARY KEY ("id"))');
        await queryRunner.query('CREATE TABLE "links" ("id" uuid NOT NULL, "code" character varying(6) NOT NULL, "longUrl" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_52a3fa2a2c27a987ed58fd2ea42" UNIQUE ("code"), CONSTRAINT "PK_ecf17f4a741d3c5ba0b4c5ab4b6" PRIMARY KEY ("id"))');
        await queryRunner.query('ALTER TABLE "clicks" ADD CONSTRAINT "FK_3e477bfbdf3a572363b65bc4525" FOREIGN KEY ("link_id") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "clicks" DROP CONSTRAINT "FK_3e477bfbdf3a572363b65bc4525"');
        await queryRunner.query('DROP TABLE "links"');
        await queryRunner.query('DROP TABLE "clicks"');
    }

}
