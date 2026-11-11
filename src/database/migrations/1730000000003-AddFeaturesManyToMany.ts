import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeaturesManyToMany1730000000003 implements MigrationInterface {
  name = 'AddFeaturesManyToMany1730000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "features" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        CONSTRAINT "UQ_bcc3a344ae156a9fba128e1cb4d" UNIQUE ("name"),
        CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE TABLE "gadget_features" (
        "gadget_id" uuid NOT NULL,
        "feature_id" uuid NOT NULL,
        CONSTRAINT "PK_4791e488b3e5d4929f2611880df" PRIMARY KEY ("gadget_id", "feature_id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e630f4d68ab66bcf30a8685b43" ON "gadget_features" ("gadget_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f45ff839b1ee871909ee7fd99" ON "gadget_features" ("feature_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "gadget_features" ADD CONSTRAINT "FK_e630f4d68ab66bcf30a8685b435"
       FOREIGN KEY ("gadget_id") REFERENCES "gadgets"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "gadget_features" ADD CONSTRAINT "FK_9f45ff839b1ee871909ee7fd99f"
       FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gadget_features" DROP CONSTRAINT "FK_9f45ff839b1ee871909ee7fd99f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gadget_features" DROP CONSTRAINT "FK_e630f4d68ab66bcf30a8685b435"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_9f45ff839b1ee871909ee7fd99"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e630f4d68ab66bcf30a8685b43"`);
    await queryRunner.query(`DROP TABLE "gadget_features"`);
    await queryRunner.query(`DROP TABLE "features"`);
  }
}
