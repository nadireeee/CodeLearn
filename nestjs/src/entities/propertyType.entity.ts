import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PropertyType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: string;
}
