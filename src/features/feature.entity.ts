import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GadgetEntity } from '../gadgets/entities/gadget.entity';

@Entity('features')
export class FeatureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @ManyToMany(() => GadgetEntity, (gadget) => gadget.features)
  gadgets: GadgetEntity[];
}
