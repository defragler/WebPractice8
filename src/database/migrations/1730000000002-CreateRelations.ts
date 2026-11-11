import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRelations1730000000002 implements MigrationInterface {
  name = 'CreateRelations1730000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "brands" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("name"),
        CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(`ALTER TABLE "gadgets" ADD "brand_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "gadgets" ADD CONSTRAINT "FK_d9a637fbc85ae998c7b85f250b2"
       FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gadgets" DROP CONSTRAINT "FK_d9a637fbc85ae998c7b85f250b2"`,
    );
    await queryRunner.query(`ALTER TABLE "gadgets" DROP COLUMN "brand_id"`);
    await queryRunner.query(`DROP TABLE "brands"`);
  }
}
