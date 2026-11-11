import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../common/db-errors';
import { FeatureEntity } from './feature.entity';

export class CreateFeatureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(FeatureEntity)
    private readonly featureRepo: Repository<FeatureEntity>,
  ) {}

  async create(dto: CreateFeatureDto): Promise<FeatureEntity> {
    try {
      return await this.featureRepo.save(this.featureRepo.create({ name: dto.name.trim() }));
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(`Фіча "${dto.name}" вже існує`);
      }
      throw err;
    }
  }

  findAll(): Promise<FeatureEntity[]> {
    return this.featureRepo.find({ order: { name: 'ASC' } });
  }

  async remove(id: string): Promise<void> {
    const result = await this.featureRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Фічу з ID ${id} не знайдено`);
    }
  }
}
