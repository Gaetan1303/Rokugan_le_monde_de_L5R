import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Scenario } from './Scenario.js';
import { User } from './User.js';
import { PlayerInRoom } from './PlayerInRoom.js';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @ManyToOne(() => User, { nullable: false })
  gm!: User;

  // Relation avec PlayerInRoom (plus flexible que User[])
  @OneToMany(() => PlayerInRoom, (pir) => pir.room)
  players!: PlayerInRoom[];

  @ManyToOne(() => Scenario, { eager: true, nullable: true })
  scenario!: Scenario;

  @Column({ type: 'varchar', default: 'waiting' })
  status!: 'waiting' | 'active' | 'paused' | 'completed';

  @Column('int', { default: 0 })
  currentScene!: number;

  @Column('simple-array', { default: '' })
  scenesHistory!: number[];

  @Column({ type: 'integer', default: 6 })
  maxPlayers!: number;

  @Column({ type: 'boolean', default: false })
  isPrivate!: boolean;

  @Column({ type: 'varchar', nullable: true })
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}