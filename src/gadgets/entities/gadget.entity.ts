import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { BrandEntity } from '../../brands/brand.entity';
import { FeatureEntity } from '../../features/feature.entity';
import { WarrantyEntity } from './warranty.entity';

@Entity('gadgets')
export class GadgetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'integer' })
  warrantyMonths: number;

  @Column({ type: 'varchar', length: 100 })
  cpu: string;

  @Column({ type: 'integer' })
  ramGb: number;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @ManyToOne(() => BrandEntity, (brand) => brand.gadgets, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Relation<BrandEntity> | null;

  @ManyToMany(() => FeatureEntity, (feature) => feature.gadgets, { cascade: true })
  @JoinTable({
    name: 'gadget_features',
    joinColumn: { name: 'gadget_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'feature_id', referencedColumnName: 'id' },
  })
  features: FeatureEntity[];

  @OneToOne(() => WarrantyEntity, (warranty) => warranty.gadget, { cascade: true })
  warranty: Relation<WarrantyEntity> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;
}
