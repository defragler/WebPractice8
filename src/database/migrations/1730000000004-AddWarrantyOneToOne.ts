import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWarrantyOneToOne1730000000004 implements MigrationInterface {
  name = 'AddWarrantyOneToOne1730000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "warranties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "durationMonths" integer NOT NULL,
        "conditions" text NOT NULL,
        "gadget_id" uuid,
        CONSTRAINT "REL_66bb47d38839164f08ac800fad" UNIQUE ("gadget_id"),
        CONSTRAINT "PK_62c441630f8a6ddcc4bc1ab1bc5" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `ALTER TABLE "warranties" ADD CONSTRAINT "FK_66bb47d38839164f08ac800fadb"
       FOREIGN KEY ("gadget_id") REFERENCES "gadgets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "warranties" DROP CONSTRAINT "FK_66bb47d38839164f08ac800fadb"`,
    );
    await queryRunner.query(`DROP TABLE "warranties"`);
  }
}
