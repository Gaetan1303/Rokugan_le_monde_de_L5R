import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Scenario } from './Scenario.js';

@Entity()
export class Scene {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column('text')
  description!: string;

  @Column('simple-array', { nullable: true })
  objectives?: string[];

  @Column('simple-array', { nullable: true })
  challenges?: string[];

  @ManyToOne(() => Scenario, scenario => scenario.scenes, { onDelete: 'CASCADE' })
  scenario!: Scenario;
}
