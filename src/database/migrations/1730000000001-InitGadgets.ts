import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitGadgets1730000000001 implements MigrationInterface {
  name = 'InitGadgets1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "gadgets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(150) NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "warrantyMonths" integer NOT NULL,
        "cpu" character varying(100) NOT NULL,
        "ramGb" integer NOT NULL,
        "isAvailable" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_cdf8116792b84dececf13ce72aa" PRIMARY KEY ("id")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "gadgets"`);
  }
}
