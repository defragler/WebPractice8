import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { GadgetEntity } from './gadget.entity';

/** Гарантійні умови — рівно один запис на гаджет (One-to-One). */
@Entity('warranties')
export class WarrantyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  durationMonths: number;

  @Column({ type: 'text' })
  conditions: string;

  // JoinColumn (власник зв'язку) — тут, тож FK gadget_id живе в таблиці warranties.
  // onDelete: CASCADE — при фізичному видаленні гаджета гарантія видаляється автоматично.
  @OneToOne(() => GadgetEntity, (gadget) => gadget.warranty, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gadget_id' })
  gadget: Relation<GadgetEntity>;
}
