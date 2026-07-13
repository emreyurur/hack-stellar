import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { LiquidityPool } from "./liquidity-pool.entity";
import { decimalTransformer } from "../../../shared/utils/decimal.transformer";

@Entity("pool_snapshots")
@Index(["poolId", "snapshotAt"])
export class PoolSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 64 })
  poolId: string;

  @ManyToOne(() => LiquidityPool, (p) => p.snapshots, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pool_id" })
  pool: LiquidityPool;

  @Column("decimal", {
    precision: 20,
    scale: 7,
    transformer: decimalTransformer,
  })
  reserveA: string;

  @Column("decimal", {
    precision: 20,
    scale: 7,
    transformer: decimalTransformer,
  })
  reserveB: string;

  @Column("decimal", {
    precision: 20,
    scale: 7,
    transformer: decimalTransformer,
  })
  totalShares: string;

  @Column("decimal", {
    precision: 20,
    scale: 7,
    nullable: true,
    transformer: decimalTransformer,
  })
  priceAUsd: string | null;

  @Column("decimal", {
    precision: 20,
    scale: 7,
    nullable: true,
    transformer: decimalTransformer,
  })
  priceBUsd: string | null;

  @Column("decimal", {
    precision: 20,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  tvlUsd: string | null;

  @Column("decimal", {
    precision: 20,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  volume24hUsd: string | null;

  @Column("timestamptz")
  snapshotAt: Date;
}
