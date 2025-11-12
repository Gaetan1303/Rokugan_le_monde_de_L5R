import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User.js';

@Entity()
export class PlayerInRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => require('./Room.js').Room, (room: any) => room.players, { onDelete: 'CASCADE' })
  room!: any;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  @Column({ default: 'player' })
  role!: 'player' | 'gm';

  @Column('jsonb', { nullable: true })
  character?: any; // Structure complète L5R (anneaux, compétences, etc.)

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSeen?: Date;
}
