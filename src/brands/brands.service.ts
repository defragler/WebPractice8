import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUniqueViolation } from '../common/db-errors';
import { BrandEntity } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(BrandEntity)
    private readonly brandRepo: Repository<BrandEntity>,
  ) {}

  async create(dto: CreateBrandDto): Promise<BrandEntity> {
    try {
      return await this.brandRepo.save(this.brandRepo.create({ name: dto.name.trim() }));
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(`Бренд "${dto.name}" вже існує`);
      }
      throw err;
    }
  }

  findAll(): Promise<BrandEntity[]> {
    return this.brandRepo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<BrandEntity> {
    const brand = await this.brandRepo.findOne({ where: { id }, relations: { gadgets: true } });
    if (!brand) {
      throw new NotFoundException(`Бренд з ID ${id} не знайдено`);
    }
    return brand;
  }

  async remove(id: string): Promise<void> {
    const result = await this.brandRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Бренд з ID ${id} не знайдено`);
    }
  }
}
