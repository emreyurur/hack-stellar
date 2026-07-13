import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { LiquidityPool } from "../../scout/entities/liquidity-pool.entity";
import { RISK_LEVELS } from "../../../shared/constants";

@Entity("risk_scores")
@Index(["poolId", "calculatedAt"])
export class RiskScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 64 })
  poolId: string;

  @ManyToOne(() => LiquidityPool, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pool_id" })
  pool: LiquidityPool;

  @Column("real")
  trustScore: number;

  @Column("real")
  tvlScore: number;

  @Column("real")
  volatilityScore: number;

  @Column("real")
  apyScore: number;

  @Column("real")
  compositeScore: number;

  @Column("varchar", { length: 10, default: RISK_LEVELS.MEDIUM })
  riskLevel: string;

  @Column("real", { nullable: true })
  estimatedApy: number | null;

  @Column("timestamptz")
  calculatedAt: Date;
}
