import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsModule } from './brands/brands.module';
import { FeaturesModule } from './features/features.module';
import { GadgetsModule } from './gadgets/gadgets.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'admin',
      database: process.env.DB_NAME ?? 'postgres',
      autoLoadEntities: true,
      synchronize: false,
      migrationsRun: false,
      logging: ['error', 'warn', 'migration'],
    }),
    BrandsModule,
    FeaturesModule,
    GadgetsModule,
  ],
})
export class AppModule {}
