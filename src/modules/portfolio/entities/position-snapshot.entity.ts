import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { UserPosition } from "./user-position.entity";
import { decimalTransformer } from "../../../shared/utils/decimal.transformer";

@Entity("position_snapshots")
@Index(["positionId", "snapshotAt"])
export class PositionSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("int")
  positionId: number;

  @ManyToOne(() => UserPosition, { onDelete: "CASCADE" })
  @JoinColumn({ name: "position_id" })
  position: UserPosition;

  @Column("decimal", {
    precision: 20,
    scale: 2,
    transformer: decimalTransformer,
  })
  valueUsd: string;

  @Column("decimal", {
    precision: 20,
    scale: 2,
    transformer: decimalTransformer,
  })
  pnlUsd: string;

  @Column("decimal", {
    precision: 20,
    scale: 4,
    transformer: decimalTransformer,
  })
  impermanentLossPct: string;

  @Column("timestamptz")
  snapshotAt: Date;
}
