import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

const bigintToNumber = {
  to: (v?: number) => v,
  from: (v?: string | null) => (v == null ? v : Number(v)),
};

/**
 * Journal d'événements en AJOUT SEUL : ne jamais faire d'UPDATE ni de DELETE.
 * Une correction passe par un nouvel événement compensatoire.
 * (Voir docs/sql/001_event_log_append_only.sql pour le verrou en base.)
 */
@Entity('event_log')
@Index(['realmId', 'scope', 'seq'], { unique: true })
@Index(['realmId', 'createdAt'])
export class EventLog {
  @PrimaryColumn('uuid')
  eventId!: string;

  @Column({ type: 'varchar', length: 64 })
  realmId!: string;

  /** Portée de la séquence, ex. `table:<id>`. */
  @Column({ type: 'varchar', length: 128 })
  scope!: string;

  @Column({ type: 'bigint', transformer: bigintToNumber })
  seq!: number;

  @Column({ type: 'varchar', length: 64 })
  type!: string;

  @Column('int')
  v!: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  actorId?: string | null;

  @Column('jsonb')
  data!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
