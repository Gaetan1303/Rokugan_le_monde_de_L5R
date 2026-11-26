import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

export type OutboxStatus = 'pending' | 'sending' | 'published' | 'failed';

/**
 * Boîte d'envoi transactionnelle : une ligne par (événement, topic) à publier sur Mercure.
 * Écrite dans la MÊME transaction que le changement d'état, lue ensuite par OutboxDispatcher.
 */
@Entity('outbox')
@Index(['status', 'nextAttemptAt'])
export class Outbox {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column('uuid')
  eventId!: string;

  @Column({ type: 'varchar', length: 255 })
  topic!: string;

  @Column({ type: 'boolean', default: false })
  isPrivate!: boolean;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: OutboxStatus;

  @Column('int', { default: 0 })
  attempts!: number;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  nextAttemptAt!: Date;

  /** Bail : tant que `lockedUntil` est dans le futur, une autre instance ne reprend pas la ligne. */
  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError?: string | null;
}
