import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum TransactionType {
  MINT = 'MINT',
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  SWAP = 'SWAP',
}

@Entity('transaction_history')
export class TransactionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userPublicKey: string;

  @Index()
  @Column({ nullable: true })
  poolId: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.SWAP,
  })
  type: TransactionType;

  @Column()
  assetA: string;

  @Column()
  amountA: string;

  @Column({ nullable: true })
  assetB: string;

  @Column({ nullable: true })
  amountB: string;

  @Column({ nullable: true })
  tx: string; // The stellar transaction hash

  @CreateDateColumn()
  createdAt: Date;
}
