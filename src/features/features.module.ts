import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureEntity } from './feature.entity';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeatureEntity])],
  providers: [FeaturesService],
  controllers: [FeaturesController],
})
export class FeaturesModule {}
