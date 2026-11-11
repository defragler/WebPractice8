import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsRelations, In, Repository } from 'typeorm';
import { BrandEntity } from '../brands/brand.entity';
import { escapeLike } from '../common/db-errors';
import { FeatureEntity } from '../features/feature.entity';
import { CreateGadgetTransactionalDto } from './dto/create-gadget-transactional.dto';
import { CreateGadgetDto } from './dto/create-gadget.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateGadgetDto } from './dto/update-gadget.dto';
import { GadgetEntity } from './entities/gadget.entity';
import { WarrantyEntity } from './entities/warranty.entity';

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const FULL_RELATIONS: FindOptionsRelations<GadgetEntity> = {
  brand: true,
  features: true,
  warranty: true,
};

@Injectable()
export class GadgetsService {
  constructor(
    @InjectRepository(GadgetEntity)
    private readonly gadgetRepo: Repository<GadgetEntity>,
    private readonly dataSource: DataSource,
  ) {}

  // ───────────────────────── CREATE (звичайне, з cascade) ─────────────────────────

  /**
   * Створення гаджета з брендом, фічами та гарантією.
   * Нові фічі зберігаються каскадно (cascade: true на M:N), гарантія — каскадно через 1:1.
   */
  async create(dto: CreateGadgetDto): Promise<GadgetEntity> {
    const { brandId, features, warranty, ...scalars } = dto;
    const manager = this.gadgetRepo.manager;

    const gadget = this.gadgetRepo.create(scalars);
    gadget.brand = brandId ? await this.requireBrand(manager, brandId) : null;
    gadget.features = await this.resolveFeatures(manager, features ?? []);
    if (warranty) {
      gadget.warranty = manager.create(WarrantyEntity, warranty);
    }

    const saved = await this.gadgetRepo.save(gadget);
    return this.findOne(saved.id);
  }

  // ───────────────────────── READ ─────────────────────────

  /**
   * Список із пагінацією, пошуком за title та фільтрами за зв'язаними сутностями (QueryBuilder).
   *  - ?brand=TechCorp  -> innerJoinAndSelect('gadget.brand') + параметризований where
   *  - ?feature=5G      -> innerJoin по M:N лише для фільтрації, а фічі для відповіді
   *                        підтягуються окремим leftJoinAndSelect (щоб у гаджета були ВСІ фічі,
   *                        а не лише відфільтрована).
   */
  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<GadgetEntity>> {
    const { page, limit, search, feature, brand, sortBy, order } = query;

    const qb = this.gadgetRepo.createQueryBuilder('gadget');

    if (brand) {
      qb.innerJoinAndSelect('gadget.brand', 'brand').andWhere(
        'LOWER(brand.name) = LOWER(:brand)',
        { brand: brand.trim() },
      );
    } else {
      qb.leftJoinAndSelect('gadget.brand', 'brand');
    }

    if (feature) {
      qb.innerJoin('gadget.features', 'featureFilter').andWhere(
        'LOWER(featureFilter.name) = LOWER(:feature)',
        { feature: feature.trim() },
      );
    }
    qb.leftJoinAndSelect('gadget.features', 'feature');
    qb.leftJoinAndSelect('gadget.warranty', 'warranty');

    if (search && search.trim() !== '') {
      qb.andWhere('gadget.title ILIKE :search', {
        search: `%${escapeLike(search.trim())}%`,
      });
    }

    qb.orderBy(`gadget.${sortBy}`, order)
      .addOrderBy('gadget.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Гаджет за ID з бренд/фічі/гарантія (relations). */
  async findOne(id: string): Promise<GadgetEntity> {
    const gadget = await this.gadgetRepo.findOne({ where: { id }, relations: FULL_RELATIONS });
    if (!gadget) {
      throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
    }
    return gadget;
  }

  /**
   * Повний агрегат через QueryBuilder: одним запитом підвантажує всі типи зв'язків —
   *  1:1 (warranty), M:N (features), M:1 (brand) та 1:M (інші гаджети цього бренду).
   */
  async findFull(id: string): Promise<GadgetEntity> {
    const gadget = await this.gadgetRepo
      .createQueryBuilder('gadget')
      .leftJoinAndSelect('gadget.warranty', 'warranty')
      .leftJoinAndSelect('gadget.features', 'feature')
      .leftJoinAndSelect('gadget.brand', 'brand')
      .leftJoinAndSelect('brand.gadgets', 'brandGadget', 'brandGadget.deletedAt IS NULL')
      .where('gadget.id = :id', { id })
      .orderBy('feature.name', 'ASC')
      .getOne();

    if (!gadget) {
      throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
    }
    return gadget;
  }

  // ───────────────────────── UPDATE / DELETE ─────────────────────────

  async update(id: string, dto: UpdateGadgetDto): Promise<GadgetEntity> {
    const gadget = await this.findOne(id);
    const { brandId, ...scalars } = dto;

    Object.assign(gadget, scalars);
    if (brandId !== undefined) {
      gadget.brand = await this.requireBrand(this.gadgetRepo.manager, brandId);
    }
    await this.gadgetRepo.save(gadget);
    return this.findOne(id);
  }

  /** М'яке видалення: у колонку deletedAt записується поточний час. */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.gadgetRepo.softDelete(id);
  }

  async restore(id: string): Promise<{ message: string }> {
    const deleted = await this.gadgetRepo.findOne({ where: { id }, withDeleted: true });
    if (!deleted) {
      throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
    }
    if (deleted.deletedAt === null) {
      return { message: 'Сутність не була видалена' };
    }
    await this.gadgetRepo.restore(id);
    return { message: 'Сутність успішно відновлена' };
  }

  // ───────────────────────── TRANSACTIONS ─────────────────────────

  /**
   * Атомарне створення агрегата: гаджет + гарантія (1:1) + фічі (M:N) + бренд (M:1).
   * Бізнес-перевірки виконуються ПІСЛЯ часткового збереження — якщо вони не проходять,
   * виняток всередині callback відкочує всю транзакцію і в БД не лишається жодного рядка.
   */
  async createTransactional(dto: CreateGadgetTransactionalDto): Promise<GadgetEntity> {
    const { brandId, features, warranty, simulateFailure, ...scalars } = dto;

    return this.dataSource.transaction(async (manager) => {
      const brand = brandId ? await this.requireBrand(manager, brandId) : null;

      // 1. Базова сутність
      const gadget = manager.create(GadgetEntity, { ...scalars, brand });
      const saved = await manager.save(gadget);

      // 2. One-to-One: гарантія
      if (warranty) {
        await manager.save(manager.create(WarrantyEntity, { ...warranty, gadget: saved }));
      }

      // 3. Many-to-Many: фічі (існуючі + нові)
      if (features?.length) {
        saved.features = await this.resolveFeatures(manager, features);
        await manager.save(saved);
      }

      // 4. Бізнес-правила / імітація збою -> rollback
      this.assertBusinessRules(dto.price, simulateFailure);

      return manager.findOneOrFail(GadgetEntity, {
        where: { id: saved.id },
        relations: FULL_RELATIONS,
      });
    });
  }

  /** Атомарне ПОВНЕ оновлення агрегата (PUT): скаляри, бренд, фічі та гарантія замінюються цілком. */
  async replaceTransactional(
    id: string,
    dto: CreateGadgetTransactionalDto,
  ): Promise<GadgetEntity> {
    const { brandId, features, warranty, simulateFailure, ...scalars } = dto;

    return this.dataSource.transaction(async (manager) => {
      const gadget = await manager.findOne(GadgetEntity, {
        where: { id },
        relations: { features: true, warranty: true },
      });
      if (!gadget) {
        throw new NotFoundException(`Сутність з ID ${id} не знайдена`);
      }

      Object.assign(gadget, { ...scalars, isAvailable: scalars.isAvailable ?? true });
      gadget.brand = brandId ? await this.requireBrand(manager, brandId) : null;
      gadget.features = await this.resolveFeatures(manager, features ?? []);
      const existingWarranty = gadget.warranty;
      await manager.save(gadget);

      if (warranty) {
        const w = existingWarranty ?? manager.create(WarrantyEntity);
        w.durationMonths = warranty.durationMonths;
        w.conditions = warranty.conditions;
        w.gadget = gadget;
        await manager.save(w);
      } else if (existingWarranty) {
        await manager.remove(existingWarranty);
      }

      this.assertBusinessRules(dto.price, simulateFailure);

      return manager.findOneOrFail(GadgetEntity, {
        where: { id },
        relations: FULL_RELATIONS,
      });
    });
  }

  // ───────────────────────── helpers ─────────────────────────

  private assertBusinessRules(price: number, simulateFailure?: boolean): void {
    if (price < 0) {
      throw new BadRequestException("Ціна не може бути від'ємною. Транзакцію відкочено.");
    }
    if (simulateFailure) {
      throw new InternalServerErrorException('Імітація збою бізнес-логіки. Транзакцію відкочено.');
    }
  }

  private async requireBrand(manager: EntityManager, id: string): Promise<BrandEntity> {
    const brand = await manager.findOneBy(BrandEntity, { id });
    if (!brand) {
      throw new NotFoundException(`Бренд з ID ${id} не знайдено`);
    }
    return brand;
  }

  /** Існуючі фічі підключаються за назвою, відсутні — створюються (збережуться каскадно). */
  private async resolveFeatures(manager: EntityManager, names: string[]): Promise<FeatureEntity[]> {
    const unique = [...new Set(names.map((n) => n.trim()).filter((n) => n !== ''))];
    if (unique.length === 0) {
      return [];
    }
    const existing = await manager.find(FeatureEntity, { where: { name: In(unique) } });
    const known = new Set(existing.map((f) => f.name));
    const created = unique
      .filter((name) => !known.has(name))
      .map((name) => manager.create(FeatureEntity, { name }));
    return [...existing, ...created];
  }
}
