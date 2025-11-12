import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
@Entity()
export class Scene {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
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

/**
 * [DEV SENIOR] Modèle Scenario - structure et logique métier d'un scénario de jeu.
 * - Définit les propriétés, méthodes et interactions des scénarios.
 * - Adapter la structure selon les évolutions du gameplay et des besoins métier.
 */

// [INTERFACES] Définition des types principaux pour les scènes, PNJ, factions, lieux et récompenses
export interface ScenarioScene {
  title: string;
  description: string;
  objectives?: string[];
  challenges?: string[];
}

export interface NPC {
  name: string;
  role: string;
  clan?: string;
  notes?: string;
}

export interface Faction {
  name: string;
  goal: string;
  attitude?: string;
}

export interface Location {
  name: string;
  type: string;
  description: string;
}

export interface Reward {
  type: string;
  description: string;
}

// [MODEL] Classe Scenario - encapsule la logique métier et les propriétés d'un scénario
@Entity()
export class Scenario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  synopsis?: string;

  @Column('simple-array', { nullable: true })
  hooks?: string[];

  @OneToMany(() => Scene, (scene: Scene) => scene.scenario, { cascade: true, eager: true })
  scenes!: Scene[];

  // Utilise les interfaces pour typer les champs JSONB
  @Column('jsonb', { nullable: true })
  npcs?: NPC[];

  @Column('jsonb', { nullable: true })
  factions?: Faction[];

  @Column('jsonb', { nullable: true })
  locations?: Location[];

  @Column('jsonb', { nullable: true })
  rewards?: Reward[];

  @Column({ default: 'standard' })
  difficulty!: string;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
