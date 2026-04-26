import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Link } from './Links';

@Entity({ name: 'clicks' })
export class Click {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Link, (link) => link.clicks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'link_id' })
  @Index()
  link!: Link;

  @Column({
    type: 'varchar',
    length: 2,
    nullable: true,
  })
  country!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  device!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  browser!: string | null;

  @Column({
    name: 'clicked_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  clickedAt!: Date;
}
