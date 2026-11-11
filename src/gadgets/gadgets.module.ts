import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandEntity } from '../brands/brand.entity';
import { FeatureEntity } from '../features/feature.entity';
import { GadgetEntity } from './entities/gadget.entity';
import { WarrantyEntity } from './entities/warranty.entity';
import { GadgetsController } from './gadgets.controller';
import { GadgetsService } from './gadgets.service';

@Module({
  imports: [TypeOrmModule.forFeature([GadgetEntity, WarrantyEntity, BrandEntity, FeatureEntity])],
  providers: [GadgetsService],
  controllers: [GadgetsController],
})
export class GadgetsModule {}
