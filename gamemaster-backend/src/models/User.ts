import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string; // Store hashed password only

  @Column({ type: 'varchar', length: 50 })
  name!: string; // Nom de l'utilisateur

  @Column({ type: 'varchar', default: 'joueur' })
  role!: string; // "GM" ou "joueur"

  @CreateDateColumn()
  createdAt!: Date;
}
