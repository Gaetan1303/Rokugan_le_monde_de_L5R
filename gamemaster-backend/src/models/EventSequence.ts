import { Entity, PrimaryColumn, Column } from 'typeorm';

/** Compteur de séquence par (royaume, portée). Incrémenté atomiquement par `appendEvent`. */
@Entity('event_sequence')
export class EventSequence {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  realmId!: string;

  @PrimaryColumn({ type: 'varchar', length: 128 })
  scope!: string;

  @Column({ type: 'bigint', default: 0 })
  last!: string;
}
