import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { PoolSnapshot } from './pool-snapshot.entity';
import { decimalTransformer } from '../../../shared/utils/decimal.transformer';

@Entity('liquidity_pools')
export class LiquidityPool {
  @PrimaryColumn('varchar', { length: 64 })
  id: string;

  @Column('smallint')
  feeBp: number;

  @Column('varchar', { length: 20, default: 'constant_product' })
  type: string;

  @Column('decimal', { precision: 20, scale: 7, transformer: decimalTransformer })
  totalShares: string;

  @Column('varchar', { length: 12 })
  assetACode: string;

  @Column('varchar', { length: 56, nullable: true })
  assetAIssuer: string | null;

  @Column('decimal', { precision: 20, scale: 7, transformer: decimalTransformer })
  reserveA: string;

  @Column('varchar', { length: 12 })
  assetBCode: string;

  @Column('varchar', { length: 56, nullable: true })
  assetBIssuer: string | null;

  @Column('decimal', { precision: 20, scale: 7, transformer: decimalTransformer })
  reserveB: string;

  @Column('int', { default: 0 })
  totalTrustlines: number;

  @Column('timestamptz')
  lastSyncedAt: Date;

  @Column('boolean', { default: true })
  isActive: boolean;

  @OneToMany(() => PoolSnapshot, (s) => s.pool)
  snapshots: PoolSnapshot[];
}
