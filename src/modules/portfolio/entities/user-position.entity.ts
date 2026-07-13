import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { LiquidityPool } from "../../scout/entities/liquidity-pool.entity";
import { decimalTransformer } from "../../../shared/utils/decimal.transformer";

@Entity("user_positions")
@Index(["userPublicKey", "poolId"], { unique: true })
export class UserPosition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar", { length: 56 })
  userPublicKey: string;

  @Column("varchar", { length: 64 })
  poolId: string;

  @ManyToOne(() => LiquidityPool, { onDelete: "CASCADE" })
  @JoinColumn({ name: "pool_id" })
  pool: LiquidityPool;

  @Column("decimal", {
    precision: 20,
    scale: 7,
    transformer: decimalTransformer,
  })
  sharesOwned: string;

  // Track the cost basis for IL/PnL calculation
  @Column("decimal", {
    precision: 20,
    scale: 7,
    transformer: decimalTransformer,
  })
  assetADeposited: string;

  @Column("decimal", {
    precision: 20,
    scale: 7,
    transformer: decimalTransformer,
  })
  assetBDeposited: string;

  @Column("timestamptz")
  firstDepositAt: Date;

  @Column("timestamptz")
  lastUpdatedAt: Date;
}
