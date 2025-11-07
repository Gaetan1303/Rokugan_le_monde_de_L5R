import { Entity } from "typeorm";
import { PrimaryGeneratedColumn } from "typeorm";
import { Column } from "typeorm";
import { CreateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ length: 255 })
  password!: string; // Store hashed password only

  @Column()
  role!: string; // "GM" ou "joueur"

  @CreateDateColumn()
  createdAt!: Date;
}
