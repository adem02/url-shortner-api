import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { Click } from './Clicks';

@Entity({name: 'links'})
export class Link {
  @PrimaryColumn({type: 'uuid'})
  id!: string;

  @Column({
    type: 'varchar',
    length: 6,
    unique: true,
  })
  @Index()
  code!: string;

  @Column({
    type: 'text'
  })
  longUrl!: string;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt!: Date;

  @OneToMany(() => Click, (click) => click.link)
  clicks!: Click[];
}
